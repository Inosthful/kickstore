const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const dollar = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export const formatPrice = (cents: number) => euro.format(cents / 100)

export const formatDollars = (cents: number) => dollar.format(cents / 100)

export const formatSize = (size: number) => String(size).replace('.', ',')

export const formatDate = (iso: string) => date.format(new Date(iso))
