export enum GateStatus {
  LOCKED = 'LOCKED', // now (UTC date) < scheduledDate (UTC date)
  ACTIVE = 'ACTIVE', // now (UTC date) === scheduledDate (UTC date)
  EXPIRED = 'EXPIRED', // now (UTC date) > scheduledDate (UTC date)
}

/**
 * Compares only the UTC calendar date (year/month/day) of `now` against the
 * schedule's `scheduledDate`, ignoring time-of-day, so a schedule is
 * considered "today" for its entire UTC day regardless of what time it was
 * created or viewed. This intentionally uses UTC everywhere (never local
 * server/client time) to avoid timezone-dependent gating bugs.
 */
export function getGateStatus(scheduledDate: Date, now: Date = new Date()): GateStatus {
  const scheduledUtcDay = Date.UTC(
    scheduledDate.getUTCFullYear(),
    scheduledDate.getUTCMonth(),
    scheduledDate.getUTCDate(),
  );
  const nowUtcDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  if (nowUtcDay < scheduledUtcDay) return GateStatus.LOCKED;
  if (nowUtcDay === scheduledUtcDay) return GateStatus.ACTIVE;
  return GateStatus.EXPIRED;
}

interface GatableSchedule {
  scheduledDate: Date;
  resourceUrl: string;
  googleMeetUrl: string;
}

export type GatedSchedule<T extends GatableSchedule> = Omit<T, 'resourceUrl' | 'googleMeetUrl'> & {
  resourceUrl: string | null;
  googleMeetUrl: string | null;
  gateStatus: GateStatus;
};

/**
 * Applies the date-gating rules to a schedule record before it is sent to a
 * student (or any other role that shouldn't get an ungated view):
 *  - LOCKED:  resource_url AND google_meet_url are both hidden.
 *  - ACTIVE:  resource_url AND google_meet_url are both visible.
 *  - EXPIRED: resource_url stays visible, google_meet_url is hidden.
 */
export function applyGating<T extends GatableSchedule>(schedule: T, now: Date = new Date()): GatedSchedule<T> {
  const gateStatus = getGateStatus(schedule.scheduledDate, now);

  return {
    ...schedule,
    resourceUrl: gateStatus === GateStatus.LOCKED ? null : schedule.resourceUrl,
    googleMeetUrl: gateStatus === GateStatus.ACTIVE ? schedule.googleMeetUrl : null,
    gateStatus,
  };
}
