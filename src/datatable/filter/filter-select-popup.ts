export interface FilterSelectPopupOption {
  value: string
  label: string
}

export interface FilterSelectPopupRequest {
  options: FilterSelectPopupOption[]
  value: string
  onSelect: (value: string) => void
}
