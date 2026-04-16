import { clearAuthSession, getAuthToken } from './authSession'

type Primitive = string | number | boolean | null
type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue }

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | JsonValue
  skipAuthToken?: boolean
  skipUnauthorizedRedirect?: boolean
}

type NormalizedRequestOptions = RequestInit & {
  skipAuthToken?: boolean
  skipUnauthorizedRedirect?: boolean
}

type RequestContext = {
  url: string
  options: NormalizedRequestOptions
}

type RequestInterceptor = (context: RequestContext) => RequestContext | Promise<RequestContext>
type ResponseInterceptor = (
  response: Response,
  context: RequestContext,
) => Response | Promise<Response>

function redirectToLogin(): void {
  const redirectTarget = `${window.location.pathname}${window.location.search}`
  const searchParams = new URLSearchParams({
    mode: 'login',
    redirect: redirectTarget,
  })

  const targetUrl = `/auth?${searchParams.toString()}`
  if (window.location.pathname === '/auth') {
    return
  }

  window.location.assign(targetUrl)
}

async function readResponseData(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  const clonedResponse = response.clone()

  if (contentType.includes('application/json')) {
    try {
      return (await clonedResponse.json()) as unknown
    } catch {
      return null
    }
  }

  try {
    const text = await clonedResponse.text()
    return text || null
  } catch {
    return null
  }
}

function extractErrorMessage(data: unknown): string {
  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (data && typeof data === 'object') {
    const mapped = data as { message?: unknown; Message?: unknown }
    if (typeof mapped.message === 'string' && mapped.message.trim()) {
      return mapped.message
    }

    if (typeof mapped.Message === 'string' && mapped.Message.trim()) {
      return mapped.Message
    }
  }

  return 'Nao foi possivel concluir a requisicao.'
}

function normalizeOptions(method: string, options: ApiRequestOptions): NormalizedRequestOptions {
  const headers = new Headers(options.headers)
  let body: BodyInit | undefined = undefined

  if (options.body !== undefined && options.body !== null) {
    if (
      typeof options.body === 'string' ||
      options.body instanceof Blob ||
      options.body instanceof FormData ||
      options.body instanceof URLSearchParams ||
      options.body instanceof ArrayBuffer ||
      ArrayBuffer.isView(options.body)
    ) {
      body = options.body
    } else if (typeof options.body === 'object') {
      headers.set('Content-Type', 'application/json')
      body = JSON.stringify(options.body)
    }
  }

  return {
    ...options,
    method,
    headers,
    body,
  }
}

class ApiClient {
  private readonly requestInterceptors: RequestInterceptor[] = []
  private readonly responseInterceptors: ResponseInterceptor[] = []

  constructor() {
    this.useRequestInterceptor((context) => {
      if (context.options.skipAuthToken) {
        return context
      }

      const token = getAuthToken()
      if (!token) {
        return context
      }

      const headers = new Headers(context.options.headers)
      headers.set('Authorization', `Bearer ${token}`)

      return {
        ...context,
        options: {
          ...context.options,
          headers,
        },
      }
    })

    this.useResponseInterceptor((response, context) => {
      if (response.status === 401 && !context.options.skipUnauthorizedRedirect) {
        clearAuthSession()
        redirectToLogin()
      }

      return response
    })
  }

  useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor)
  }

  useResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor)
  }

  async request<T>(url: string, method: string, options: ApiRequestOptions = {}): Promise<T> {
    let context: RequestContext = {
      url,
      options: normalizeOptions(method, options),
    }

    for (const interceptor of this.requestInterceptors) {
      context = await interceptor(context)
    }

    let response = await fetch(context.url, context.options)

    for (const interceptor of this.responseInterceptors) {
      response = await interceptor(response, context)
    }

    const responseData = await readResponseData(response)

    if (!response.ok) {
      throw new ApiError(extractErrorMessage(responseData), response.status, responseData)
    }

    return responseData as T
  }

  get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(url, 'GET', options)
  }

  post<T>(url: string, body?: ApiRequestOptions['body'], options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(url, 'POST', {
      ...options,
      body,
    })
  }

  put<T>(url: string, body?: ApiRequestOptions['body'], options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(url, 'PUT', {
      ...options,
      body,
    })
  }

  delete<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(url, 'DELETE', options)
  }
}

export const apiClient = new ApiClient()
