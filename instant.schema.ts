import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email:    i.string().unique().indexed().optional(),
      fullName: i.string().optional(),
      role:     i.string().optional(),
    }),

    userState: i.entity({
      userId:           i.string().indexed(),
      email:            i.string().optional(),
      role:             i.string().optional(),
      teacherApproved:  i.boolean().optional(),
      xp:               i.number().optional(),
      balance:          i.number().optional(),
      totalEarned:      i.number().optional(),
      totalInvested:    i.number().optional(),
      totalDebt:        i.number().optional(),
      netWorth:         i.number().optional(),
      streak:           i.number().optional(),
      lastActivityDate: i.number().optional(),
      completedLessons: i.json().optional(),
      completedModules: i.json().optional(),
      badges:           i.json().optional(),
      currentJobId:     i.string().optional(),
      lastSalaryPaid:   i.number().optional(),
      lastWeeklyTick:   i.number().optional(),
      pendingLifeEvent: i.string().optional(),
      pendingNews:      i.string().optional(),
      goals:            i.string().optional(),
    }),

    userStocks: i.entity({
      userId:          i.string().indexed(),
      symbol:          i.string().optional(),
      name:            i.string().optional(),
      quantity:        i.number().optional(),
      purchasePrice:   i.number().optional(),
      purchaseDate:    i.number().optional(),
      currentValue:    i.number().optional(),
      dividendsEarned: i.number().optional(),
    }),

    userProperties: i.entity({
      userId:          i.string().indexed(),
      name:            i.string().optional(),
      purchasePrice:   i.number().optional(),
      currentValue:    i.number().optional(),
      purchaseDate:    i.number().optional(),
      weeklyRent:      i.number().optional(),
      mortgageWeekly:  i.number().optional(),
      mortgageBalance: i.number().optional(),
    }),

    userLoans: i.entity({
      userId:          i.string().indexed(),
      name:            i.string().optional(),
      principal:       i.number().optional(),
      balance:         i.number().optional(),
      interestRate:    i.number().optional(),
      weeklyRepayment: i.number().optional(),
      startDate:       i.number().optional(),
    }),

    userAssets: i.entity({
      userId:           i.string().indexed(),
      name:             i.string().optional(),
      category:         i.string().optional(),
      purchasePrice:    i.number().optional(),
      currentValue:     i.number().optional(),
      depreciationRate: i.number().optional(),
      purchaseDate:     i.number().optional(),
    }),

    teacherRequests: i.entity({
      userId:      i.string().indexed(),
      email:       i.string().indexed(),
      fullName:    i.string().optional(),
      school:      i.string().optional(),
      message:     i.string().optional(),
      status:      i.string().optional(),
      createdAt:   i.number().optional(),
      reviewedAt:  i.number().optional(),
    }),

    classrooms: i.entity({
      name:            i.string(),
      joinCode:        i.string().unique().indexed(),
      ownerEmail:      i.string().indexed().optional(),
      ownerId:         i.string().indexed().optional(),
      isActive:        i.boolean().optional(),
      createdAt:       i.number().optional(),
      description:     i.string().optional(),
      subject:         i.string().optional(),
      yearLevel:       i.string().optional(),
      announcement:    i.string().optional(),
      announcedAt:     i.number().optional(),
      xpMultiplier:    i.number().optional(),
      assignedModules: i.json().optional(),
      challenge:       i.string().optional(),
      subscriptionId:  i.string().optional(),  // linked subscription
    }),

    classEnrollments: i.entity({
      classroomId:  i.string().indexed(),
      studentEmail: i.string().indexed(),
      studentId:    i.string().indexed().optional(),
      joinedDate:   i.number().optional(),
    }),

    classAnnouncements: i.entity({
      classroomId: i.string().indexed(),
      authorEmail: i.string().optional(),
      text:        i.string().optional(),
      createdAt:   i.number().optional(),
    }),

    // ── Subscription plans ────────────────────────────────────────────────
    subscriptions: i.entity({
      planCode:      i.string().unique().indexed(), // the code teacher enters
      ownerEmail:    i.string().indexed().optional(),
      ownerId:       i.string().indexed().optional(),
      classroomId:   i.string().indexed().optional(),
      status:        i.string().optional(), // "active" | "expired" | "unused"
      plan:          i.string().optional(), // "trial" | "monthly" | "annual"
      activatedAt:   i.number().optional(),
      expiresAt:     i.number().optional(),
      studentLimit:  i.number().optional(), // max students (default 35)
      createdAt:     i.number().optional(),
    }),
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;
export type { AppSchema };
export default schema;
