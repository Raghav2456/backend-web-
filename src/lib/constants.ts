export const roles = ["ADMIN", "ANALYST", "VIEWER"] as const;
export type Role = (typeof roles)[number];

export const feedbackStatuses = ["NEW", "TRIAGED", "IN_PROGRESS", "RESOLVED", "ARCHIVED"] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

export const feedbackSentiments = ["POSITIVE", "NEUTRAL", "NEGATIVE"] as const;
export type FeedbackSentiment = (typeof feedbackSentiments)[number];
