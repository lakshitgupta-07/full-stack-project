import { User } from "../models/user.model.js";
import { Banner } from "../models/banner.model.js";
export const getDashboardStatsService = async () => {
  const stats = await User.aggregate([
    {
      $facet: {
        totalUsers: [
          {
            $count: "count",
          },
        ],
        verifiedUsers: [
          {
            $match: {
              isEmailVerified: true,
            },
          },
          {
            $count: "count",
          },
        ],
        unverifiedUsers: [
          {
            $match: {
              isEmailVerified: false,
            },
          },
          {
            $count: "count",
          },
        ],
        googleUsers: [
          {
            $match: {
              provider: "google",
            },
          },
          {
            $count: "count",
          },
        ],
        localUsers: [
          {
            $match: {
              provider: "local",
            },
          },
          {
            $count: "count",
          },
        ],
        githubUser: [
          {
            $match: {
              provider: "github",
            }
          },
          {
            $count: "count"
          }
        ],
        adminUsers: [
          {
            $match: {
              role: "admin",
            },
          },
          {
            $count: "count",
          },
        ],
      },
    },
  ]);

  const dashboard = stats[0];
  return {
    totalUsers: dashboard.totalUsers[0]?.count ?? 0,
    verifiedUsers: dashboard.verifiedUsers[0]?.count ?? 0,
    unverifiedUsers: dashboard.unverifiedUsers[0]?.count ?? 0,
    googleUsers: dashboard.googleUsers[0]?.count ?? 0,
    localUsers: dashboard.localUsers[0]?.count ?? 0,
    adminUsers: dashboard.adminUsers[0]?.count ?? 0,
  };
};

export const getAllUserService = async () => {
  const users = User.aggregate([
    {
      $project: {
        username: 1,
        email: 1,
        provider: 1,
        role: 1,
        _id: 0,
        isEmailVerified: 1,
      },
    },
  ]);
  return users;
};

export const getUserService = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = query.search || "";

  const matchStage: any = {};
  if (search) {
    matchStage.$or = [
      {
        username: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const user = await User.aggregate([
    {
      $match: matchStage,
    },
    {
      $facet: {
        users: [
          {
            $sort: {
              createdAt: -1,
            },
          },
          {
            $skip: 0,
          },
          {
            $limit: 10,
          },
          {
            $project: {
              password: 0,
              refreshToken: 0,
              __v: 0,

              avatar: 0,
              googleId: 0,
            },
          },
        ],
        totalCount: [
          {
            $count: "count",
          },
        ],
      },
    },
  ]);
  const users = user[0].users
  const totalUsers = user[0].totalCount[0]?.count ?? 0
  const totalPages = Math.ceil(totalUsers/ limit)
  return {
    users,
    pagination: {
      currentPage: page,

        limit,

        totalUsers,

        totalPages,

        hasNextPage: page < totalPages,

        hasPreviousPage: page > 1,
    }
  };
};

export const getUserAnalyticsService = async() => {
  const result = await User.aggregate([
    {
      $group: {
        _id: "$provider",
        count: {
          $sum: 1
        }
      }
    },
    {
      $project: {
        _id:0,
        provider: "$_id",
        count:1
      }
    }
  ])
  return result
};

export const getAllBannerService = async() => {
  const banner = await Banner.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "creator",
      },
    },
    {
      $unwind: "$creator",
    },
    {
      $project: {
        title: 1,
        description: 1,
        isActive: 1,
        createdAt: 1,
        creator: {
          username: "$creator.username",
          email: "$creator.email",
          role: "$creator.role",
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ])
  return banner
}