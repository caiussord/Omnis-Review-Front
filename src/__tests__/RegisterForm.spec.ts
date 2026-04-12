import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RegisterForm from '@/components/auth/RegisterForm.vue'

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should mount successfully', () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('should render all required input fields', () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      expect(wrapper.find('#name').exists()).toBe(true)
      expect(wrapper.find('#register-email').exists()).toBe(true)
      expect(wrapper.find('#username').exists()).toBe(true)
      expect(wrapper.find('#birthdate').exists()).toBe(true)
      expect(wrapper.find('#register-password').exists()).toBe(true)
      expect(wrapper.find('#confirm-password').exists()).toBe(true)
    })

    it('should render submit button', () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.exists()).toBe(true)
    })

    it('should render password visibility toggles for both password fields', () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const toggleButtons = wrapper.findAll('button.auth-password-toggle')
      expect(toggleButtons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('props', () => {
    it('should accept isLoading prop', () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })
      expect(wrapper.props('isLoading')).toBe(false)
    })

    it('should disable submit button when isLoading is true', () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: true,
          backendBaseUrl: 'http://localhost:3000',
        },
      })
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('password validation', () => {
    it('should show password rules', () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      expect(wrapper.text()).toContain('Mínimo de 8 caracteres')
      expect(wrapper.text()).toContain('Uma letra minúscula')
      expect(wrapper.text()).toContain('Uma letra maiúscula')
      expect(wrapper.text()).toContain('Um número')
      expect(wrapper.text()).toContain('Um símbolo')
      expect(wrapper.text()).toContain('As senhas conferem')
    })

    it('should validate password length requirement', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const passwordInput = wrapper.find('#register-password')
      await passwordInput.setValue('Short1!')

      expect(wrapper.text()).toContain('Mínimo de 8 caracteres')

      await passwordInput.setValue('LongPassword1!')
    })

    it('should validate password requires lowercase letter', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const passwordInput = wrapper.find('#register-password')
      await passwordInput.setValue('PASSWORD1!')

      expect(wrapper.text()).toContain('Uma letra minúscula')

      await passwordInput.setValue('PaSSWORD1!')
    })

    it('should validate password requires uppercase letter', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const passwordInput = wrapper.find('#register-password')
      await passwordInput.setValue('password1!')

      expect(wrapper.text()).toContain('Uma letra maiúscula')

      await passwordInput.setValue('Password1!')
    })

    it('should validate password requires number', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const passwordInput = wrapper.find('#register-password')
      await passwordInput.setValue('Password!')

      expect(wrapper.text()).toContain('Um número')

      await passwordInput.setValue('Password1!')
    })

    it('should validate password requires symbol', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const passwordInput = wrapper.find('#register-password')
      await passwordInput.setValue('Password1')

      expect(wrapper.text()).toContain('Um símbolo')

      await passwordInput.setValue('Password1!')
    })
  })

  describe('password confirmation', () => {
    it('should validate passwords match', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const passwordInput = wrapper.find('#register-password')
      const confirmPasswordInput = wrapper.find('#confirm-password')

      await passwordInput.setValue('ValidPass1!')
      await confirmPasswordInput.setValue('ValidPass1!')

      expect(wrapper.text()).toContain('As senhas conferem')
    })

    it('should show mismatch when confirm password does not match', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const passwordInput = wrapper.find('#register-password')
      const confirmPasswordInput = wrapper.find('#confirm-password')

      await passwordInput.setValue('ValidPass1!')
      await confirmPasswordInput.setValue('DifferentPass1!')

      expect(wrapper.text()).toContain('As senhas conferem')
    })

    it('should toggle confirm password visibility', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const confirmPasswordInput = wrapper.find('#confirm-password')
      const toggleButtons = wrapper.findAll('button.auth-password-toggle')
      expect(toggleButtons).toHaveLength(2)

      expect((confirmPasswordInput.element as HTMLInputElement).type).toBe('password')

      await toggleButtons[1]!.trigger('click')
      expect((confirmPasswordInput.element as HTMLInputElement).type).toBe('text')

      await toggleButtons[1]!.trigger('click')
      expect((confirmPasswordInput.element as HTMLInputElement).type).toBe('password')
    })
  })

  describe('form submission', () => {
    it('should emit submit event with complete form data', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      await wrapper.find('#name').setValue('João Silva')
      await wrapper.find('#register-email').setValue('joao@example.com')
      await wrapper.find('#username').setValue('joaosilva')
      await wrapper.find('#birthdate').setValue('1990-01-15')
      await wrapper.find('#register-password').setValue('ValidPass1!')
      await wrapper.find('#confirm-password').setValue('ValidPass1!')

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(wrapper.emitted('submit')).toHaveLength(1)
      const emittedData = wrapper.emitted('submit')?.[0]?.[0]
      expect(emittedData).toEqual({
        name: 'João Silva',
        email: 'joao@example.com',
        userName: 'joaosilva',
        birth_Date: '1990-01-15',
        password: 'ValidPass1!',
        confirmPassword: 'ValidPass1!',
      })
    })

    it('should include confirmPassword in submit payload', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      await wrapper.find('#name').setValue('Test User')
      await wrapper.find('#register-email').setValue('test@example.com')
      await wrapper.find('#username').setValue('testuser')
      await wrapper.find('#birthdate').setValue('1995-05-20')
      await wrapper.find('#register-password').setValue('TestPass1!')
      await wrapper.find('#confirm-password').setValue('TestPass1!')

      const form = wrapper.find('form')
      await form.trigger('submit')

      const emittedData = wrapper.emitted('submit')?.[0]?.[0]
      expect(emittedData).toHaveProperty('confirmPassword')
      expect((emittedData as any).confirmPassword).toBe('TestPass1!')
    })

    it('should not emit submit with empty required fields', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(wrapper.emitted('submit')).toBeUndefined()
    })

    it('should not emit submit with invalid password', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      await wrapper.find('#name').setValue('Test User')
      await wrapper.find('#register-email').setValue('test@example.com')
      await wrapper.find('#username').setValue('testuser')
      await wrapper.find('#birthdate').setValue('1995-05-20')
      await wrapper.find('#register-password').setValue('weak')
      await wrapper.find('#confirm-password').setValue('weak')

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(wrapper.emitted('submit')).toBeUndefined()
    })

    it('should not emit submit with mismatched passwords', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      await wrapper.find('#name').setValue('Test User')
      await wrapper.find('#register-email').setValue('test@example.com')
      await wrapper.find('#username').setValue('testuser')
      await wrapper.find('#birthdate').setValue('1995-05-20')
      await wrapper.find('#register-password').setValue('ValidPass1!')
      await wrapper.find('#confirm-password').setValue('DifferentPass1!')

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(wrapper.emitted('submit')).toBeUndefined()
    })
  })

  describe('password visibility toggle', () => {
    it('should toggle password visibility on button click', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const passwordInput = wrapper.find('#register-password')
      const toggleButtons = wrapper.findAll('button.auth-password-toggle')
      expect(toggleButtons).toHaveLength(2)

      expect((passwordInput.element as HTMLInputElement).type).toBe('password')

      await toggleButtons[0]!.trigger('click')
      expect((passwordInput.element as HTMLInputElement).type).toBe('text')

      await toggleButtons[0]!.trigger('click')
      expect((passwordInput.element as HTMLInputElement).type).toBe('password')
    })

    it('should independently toggle password and confirm password visibility', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const passwordInput = wrapper.find('#register-password')
      const confirmPasswordInput = wrapper.find('#confirm-password')
      const toggleButtons = wrapper.findAll('button.auth-password-toggle')
      expect(toggleButtons).toHaveLength(2)

      await toggleButtons[0]!.trigger('click')
      expect((passwordInput.element as HTMLInputElement).type).toBe('text')
      expect((confirmPasswordInput.element as HTMLInputElement).type).toBe('password')

      await toggleButtons[1]!.trigger('click')
      expect((passwordInput.element as HTMLInputElement).type).toBe('text')
      expect((confirmPasswordInput.element as HTMLInputElement).type).toBe('text')

      await toggleButtons[0]!.trigger('click')
      expect((passwordInput.element as HTMLInputElement).type).toBe('password')
      expect((confirmPasswordInput.element as HTMLInputElement).type).toBe('text')
    })
  })

  describe('form state management', () => {
    it('should maintain form state across multiple interactions', async () => {
      const wrapper = mount(RegisterForm, {
        props: {
          isLoading: false,
          backendBaseUrl: 'http://localhost:3000',
        },
      })

      const nameInput = wrapper.find('#name')
      const emailInput = wrapper.find('#register-email')

      await nameInput.setValue('Test User')
      await emailInput.setValue('test@example.com')

      expect((nameInput.element as HTMLInputElement).value).toBe('Test User')
      expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com')

      await nameInput.setValue('Updated Name')
      expect((nameInput.element as HTMLInputElement).value).toBe('Updated Name')
    })
  })
})
