import type { InstantRules } from "@instantdb/react";

const rules = {
  userState: {
    allow: {
      view:   "auth.id != null",
      create: "auth.id != null && data.userId == auth.id",
      update: "auth.id != null && data.userId == auth.id",
      delete: "auth.id != null && data.userId == auth.id",
    },
  },
  userStocks: {
    allow: {
      view:   "auth.id != null && data.userId == auth.id",
      create: "auth.id != null && data.userId == auth.id",
      update: "auth.id != null && data.userId == auth.id",
      delete: "auth.id != null && data.userId == auth.id",
    },
  },
  userProperties: {
    allow: {
      view:   "auth.id != null && data.userId == auth.id",
      create: "auth.id != null && data.userId == auth.id",
      update: "auth.id != null && data.userId == auth.id",
      delete: "auth.id != null && data.userId == auth.id",
    },
  },
  userLoans: {
    allow: {
      view:   "auth.id != null && data.userId == auth.id",
      create: "auth.id != null && data.userId == auth.id",
      update: "auth.id != null && data.userId == auth.id",
      delete: "auth.id != null && data.userId == auth.id",
    },
  },
  userAssets: {
    allow: {
      view:   "auth.id != null && data.userId == auth.id",
      create: "auth.id != null && data.userId == auth.id",
      update: "auth.id != null && data.userId == auth.id",
      delete: "auth.id != null && data.userId == auth.id",
    },
  },
  teacherRequests: {
    allow: {
      view:   "auth.id != null",
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  classrooms: {
    allow: {
      view:   "auth.id != null",
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null && data.ownerId == auth.id",
    },
  },
  classEnrollments: {
    allow: {
      view:   "auth.id != null",
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  classAnnouncements: {
    allow: {
      view:   "auth.id != null",
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
} satisfies InstantRules;

export default rules;
