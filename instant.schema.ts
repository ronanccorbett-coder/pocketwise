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
      role:             i.string().optional(),       // "student" | "teacher"
      teacherApproved:  i.boolean().optional(),      // set by admin
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
      status:      i.string().optional(), // "pending" | "approved" | "rejected"
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
      announcement:    i.string().optional(),         // latest announcement text
      announcedAt:     i.number().optional(),
      xpMultiplier:    i.number().optional(),         // class-wide XP boost (1.0 default)
      assignedModules: i.json().optional(),           // array of folder names
      challenge:       i.string().optional(),         // JSON of current challenge
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
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;
export type { AppSchema };
export default schema;
