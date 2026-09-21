import type {
  ProfileEconomic,
  ProfilePolitical,
  ProfileSnapshot,
  ProfileSocial,
} from "@/lib/profile/profileRepo";

/** JSON-safe shape of `ConstituencyProfileDoc` for the server->client boundary
 * (`_id`/`created_at` dropped — unused by the editor; `updated_at` as ISO). */
export type ClientProfile = {
  ac_no: number;
  snapshot: ProfileSnapshot;
  social: ProfileSocial;
  economic: ProfileEconomic;
  political: ProfilePolitical;
  brief_en?: string;
  brief_hi?: string;
  updated_by: string;
  updated_at: string;
};

export type SaveResult = { ok: true } | { ok: false; message: string };
