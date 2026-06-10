export const BehaviourType = {
  DEFAULT_READER: "DEFAULT_READER",
  MOBILE_CASUAL: "MOBILE_CASUAL",
  QUICK_SCANNER: "QUICK_SCANNER",
  DEEP_ENGAGER: "DEEP_ENGAGER",
  CUSTOM_CLICKER: "CUSTOM_CLICKER",
} as const

export type BehaviourType = (typeof BehaviourType)[keyof typeof BehaviourType]

export const BEHAVIOUR_TYPE_LABELS: Record<BehaviourType, string> = {
  DEFAULT_READER: "Default Reader",
  MOBILE_CASUAL: "Mobile Casual",
  QUICK_SCANNER: "Quick Scanner",
  DEEP_ENGAGER: "Deep Engager",
  CUSTOM_CLICKER: "Custom Clicker",
}
