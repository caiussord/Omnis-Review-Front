import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthModeSwitch from '@/components/auth/AuthModeSwitch.vue'

describe('AuthModeSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should mount successfully', () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'login',
        },
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('should render login and register buttons', () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'login',
        },
      })
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0]!.text()).toContain('Login')
      expect(buttons[1]!.text()).toContain('Cadastro')
    })

    it('should have tablist role for accessibility', () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'login',
        },
      })
      const tablist = wrapper.find('[role="tablist"]')
      expect(tablist.exists()).toBe(true)
    })

    it('should have aria-label for accessibility', () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'login',
        },
      })
      const tablist = wrapper.find('[role="tablist"]')
      expect(tablist.attributes('aria-label')).toBe('Alternar formulário')
    })
  })

  describe('props', () => {
    it('should accept mode prop with value "login"', () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'login',
        },
      })
      expect(wrapper.props('mode')).toBe('login')
    })

    it('should accept mode prop with value "register"', () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'register',
        },
      })
      expect(wrapper.props('mode')).toBe('register')
    })
  })

  describe('active state styling', () => {
    it('should apply active class to login button when mode is "login"', () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'login',
        },
      })
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0]!.classes()).toContain('auth-switch__button--active')
      expect(buttons[1]!.classes()).not.toContain('auth-switch__button--active')
    })

    it('should apply active class to register button when mode is "register"', () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'register',
        },
      })
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0]!.classes()).not.toContain('auth-switch__button--active')
      expect(buttons[1]!.classes()).toContain('auth-switch__button--active')
    })
  })

  describe('aria-selected attribute', () => {
    it('should set correct aria-selected attributes when mode is "login"', () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'login',
        },
      })
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0]!.attributes('aria-selected')).toBe('true')
      expect(buttons[1]!.attributes('aria-selected')).toBe('false')
    })

    it('should set correct aria-selected attributes when mode is "register"', () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'register',
        },
      })
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0]!.attributes('aria-selected')).toBe('false')
      expect(buttons[1]!.attributes('aria-selected')).toBe('true')
    })
  })

  describe('select event emission', () => {
    it('should emit select event with "login" when login button is clicked', async () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'register',
        },
      })
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      await buttons[0]!.trigger('click')

      expect(wrapper.emitted('select')).toHaveLength(1)
      expect(wrapper.emitted('select')?.[0]).toEqual(['login'])
    })

    it('should emit select event with "register" when register button is clicked', async () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'login',
        },
      })
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      await buttons[1]!.trigger('click')

      expect(wrapper.emitted('select')).toHaveLength(1)
      expect(wrapper.emitted('select')?.[0]).toEqual(['register'])
    })

    it('should emit select event multiple times on multiple clicks', async () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'login',
        },
      })
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)

      await buttons[1]!.trigger('click')
      await buttons[0]!.trigger('click')
      await buttons[1]!.trigger('click')

      expect(wrapper.emitted('select')).toHaveLength(3)
      expect(wrapper.emitted('select')?.[0]).toEqual(['register'])
      expect(wrapper.emitted('select')?.[1]).toEqual(['login'])
      expect(wrapper.emitted('select')?.[2]).toEqual(['register'])
    })
  })

  describe('mode switching', () => {
    it('should respond to mode prop changes', async () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'login',
        },
      })

      let buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0]!.classes()).toContain('auth-switch__button--active')

      await wrapper.setProps({ mode: 'register' })

      buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[1]!.classes()).toContain('auth-switch__button--active')
    })

    it('should update aria-selected when mode prop changes', async () => {
      const wrapper = mount(AuthModeSwitch, {
        props: {
          mode: 'login',
        },
      })

      let buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0]!.attributes('aria-selected')).toBe('true')

      await wrapper.setProps({ mode: 'register' })

      buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[1]!.attributes('aria-selected')).toBe('true')
    })
  })
})
