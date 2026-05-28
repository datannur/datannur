import db from '@db'

type Value = boolean | string | number
type Option = { id: string; value: Value }

export default class Options {
  static loaded: Promise<void>
  static isLoading = false
  static dbKey: string
  static options: Option[]

  static init(defaults?: { [key: string]: Value }) {
    if (this.isLoading) return this.loaded

    this.isLoading = true
    this.loaded = new Promise<void>(resolve => {
      this.dbKey = 'userData/option'
      this.options = []
      db.browser.get(this.dbKey).then(options => {
        if (options) {
          this.options = options as Option[]
        }
        if (defaults) {
          this.setDefaults(defaults)
        }
        resolve()
      })
    })
    return this.loaded
  }
  static getOption(id: string) {
    return this.options.find(element => element.id === id)
  }
  static get(id: string) {
    return this.getOption(id)?.value
  }
  static set(id: string, value: Value, callback = () => {}) {
    const option = this.getOption(id)
    if (option) option.value = value
    else this.options.push({ id, value })
    this.save(callback)
  }
  static save(callback = () => {}) {
    db.browser.set(this.dbKey, this.options, callback)
  }

  static setDefaults(defaults: { [key: string]: Value }, applyToDOM = true) {
    Object.entries(defaults).forEach(([key, value]) => {
      let optionValue = this.get(key)
      if (optionValue === undefined) {
        optionValue = value
        this.set(key, value)
      }
      if (applyToDOM && optionValue) {
        document.documentElement.classList.add(key)
      }
    })
  }
}
