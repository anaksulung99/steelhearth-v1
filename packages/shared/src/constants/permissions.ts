export type ProtectedFeature = "campaigns" | "fingerprints";
export type ProtectedFeatureAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export";

// const FEATURE_ACTION_ROLES: Record<
//   ProtectedFeature,
//   Partial<Record<ProtectedFeatureAction, AppRole[]>>
// > = {
//   campaigns: {
//     view: ["admin", "operator"],
//     create: ["admin"],
//     edit: ["admin"],
//     delete: ["admin"],
//   },
//   fingerprints: {
//     view: ["admin", "operator"],
//     create: ["admin"],
//     edit: ["admin"],
//     delete: ["admin"],
//     export: ["admin"],
//   },
// };

// export function getFeatureActionRoles(
//   feature: ProtectedFeature,
//   action: ProtectedFeatureAction,
// ): AppRole[] {
//   return [...(FEATURE_ACTION_ROLES[feature][action] ?? [])];
// }

// export function canAccessFeatureAction(
//   role: AppRole,
//   feature: ProtectedFeature,
//   action: ProtectedFeatureAction,
// ): boolean {
//   const allowedRoles = FEATURE_ACTION_ROLES[feature][action];

//   if (!allowedRoles?.length) {
//     return true;
//   }

//   return allowedRoles.includes(role);
// }
