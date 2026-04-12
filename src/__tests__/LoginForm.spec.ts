import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginForm from '@/components/auth/LoginForm.vue'

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should mount successfully', () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('should render email input field', () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })
      const emailInput = wrapper.find('#email')
      expect(emailInput.exists()).toBe(true)
      expect((emailInput.element as HTMLInputElement).type).toBe('text')
    })

    it('should render password input field', () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })
      const passwordInput = wrapper.find('#password')
      expect(passwordInput.exists()).toBe(true)
      expect((passwordInput.element as HTMLInputElement).type).toBe('password')
    })

    it('should render submit button', () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.exists()).toBe(true)
      expect(submitButton.text()).toBe('Entrar')
    })

    it('should render forgot password button', () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })
      const forgotButton = wrapper.find('button.auth-forgot-password')
      expect(forgotButton.exists()).toBe(true)
      expect(forgotButton.text()).toContain('Esqueci minha senha')
    })
  })

  describe('props', () => {
    it('should accept isLoading prop', () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })
      expect(wrapper.props('isLoading')).toBe(false)
    })

    it('should disable submit button when isLoading is true', async () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: true,
        },
      })
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should show loading text when isLoading is true', () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: true,
        },
      })
      expect(wrapper.text()).toContain('Entrando...')
    })

    it('should show default text when isLoading is false', () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })
      expect(wrapper.text()).toContain('Entrar')
    })
  })

  describe('password visibility toggle', () => {
    it('should toggle password visibility on button click', async () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })
      const passwordInput = wrapper.find('#password')
      const toggleButton = wrapper.find('button.auth-password-toggle')

      expect((passwordInput.element as HTMLInputElement).type).toBe('password')

      await toggleButton.trigger('click')
      expect((passwordInput.element as HTMLInputElement).type).toBe('text')

      await toggleButton.trigger('click')
      expect((passwordInput.element as HTMLInputElement).type).toBe('password')
    })

    it('should update toggle button aria-pressed attribute', async () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })
      const toggleButton = wrapper.find('button.auth-password-toggle')

      expect(toggleButton.attributes('aria-pressed')).toBe('false')

      await toggleButton.trigger('click')
      expect(toggleButton.attributes('aria-pressed')).toBe('true')

      await toggleButton.trigger('click')
      expect(toggleButton.attributes('aria-pressed')).toBe('false')
    })

    it('should update toggle button text', async () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })
      const toggleButton = wrapper.find('button.auth-password-toggle')

      expect(toggleButton.text()).toBe('Ver senha')

      await toggleButton.trigger('click')
      expect(toggleButton.text()).toBe('Ocultar')

      await toggleButton.trigger('click')
      expect(toggleButton.text()).toBe('Ver senha')
    })
  })

  describe('form submission', () => {
    it('should emit submit event with trimmed credentials when form is submitted', async () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })

      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')

      await emailInput.setValue('  test@example.com  ')
      await passwordInput.setValue('password123')

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(wrapper.emitted('submit')).toHaveLength(1)
      expect(wrapper.emitted('submit')?.[0]).toEqual([
        {
          email: 'test@example.com',
          password: 'password123',
        },
      ])
    })

    it('should not emit submit event with empty email', async () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })

      const passwordInput = wrapper.find('#password')
      await passwordInput.setValue('password123')

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(wrapper.emitted('submit')).toBeUndefined()
    })

    it('should not emit submit event with empty password', async () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })

      const emailInput = wrapper.find('#email')
      await emailInput.setValue('test@example.com')

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(wrapper.emitted('submit')).toBeUndefined()
    })

    it('should not emit submit event with both fields empty', async () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(wrapper.emitted('submit')).toBeUndefined()
    })
  })

  describe('forgotPassword event', () => {
    it('should emit forgotPassword event when forgot password button is clicked', async () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })

      const forgotButton = wrapper.find('button.auth-forgot-password')
      await forgotButton.trigger('click')

      expect(wrapper.emitted('forgotPassword')).toHaveLength(1)
    })

    it('should not emit submit when forgot password is clicked', async () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })

      const forgotButton = wrapper.find('button.auth-forgot-password')
      await forgotButton.trigger('click')

      expect(wrapper.emitted('submit')).toBeUndefined()
    })
  })

  describe('form state management', () => {
    it('should maintain form state across multiple interactions', async () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })

      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')

      await emailInput.setValue('user@example.com')
      await passwordInput.setValue('mypassword')

      expect((emailInput.element as HTMLInputElement).value).toBe('user@example.com')
      expect((passwordInput.element as HTMLInputElement).value).toBe('mypassword')
    })

    it('should preserve form state after failed submission attempt', async () => {
      const wrapper = mount(LoginForm, {
        props: {
          isLoading: false,
        },
      })

      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')

      await emailInput.setValue('user@example.com')
      await passwordInput.setValue('password123')

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(wrapper.emitted('submit')).toHaveLength(1)

      // Form state should still contain previously entered values
      expect((emailInput.element as HTMLInputElement).value).toBe('user@example.com')
      expect((passwordInput.element as HTMLInputElement).value).toBe('password123')
    })
  })
})
