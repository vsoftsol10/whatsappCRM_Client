// const { PrismaClient, NotificationType } = require("@prisma/client");

// const prisma = new PrismaClient();

// // ==========================================
// // CREATE NOTIFICATION FOR A SINGLE USER
// // ==========================================
// const notifyUser = async ({
//   userId,
//   title,
//   message,
//   type,
// }) => {
//   try {
//     return await prisma.notification.create({
//       data: {
//         userId,
//         title,
//         message,
//         type,
//       },
//     });
//   } catch (error) {
//     console.error("Notify User Error:", error);
//     throw error;
//   }
// };

// // ==========================================
// // CREATE NOTIFICATIONS FOR MULTIPLE USERS
// // ==========================================
// const notifyUsers = async ({
//   userIds,
//   title,
//   message,
//   type,
// }) => {
//   try {
//     if (!userIds || userIds.length === 0) {
//       return;
//     }

//     return await prisma.notification.createMany({
//       data: userIds.map((userId) => ({
//         userId,
//         title,
//         message,
//         type,
//       })),
//     });
//   } catch (error) {
//     console.error("Notify Users Error:", error);
//     throw error;
//   }
// };

// // ==========================================
// // CREATE NOTIFICATION FOR ALL ADMINS
// // ==========================================
// const notifyAdmins = async ({
//   title,
//   message,
//   type,
// }) => {
//   try {
//     const admins = await prisma.user.findMany({
//       where: {
//         role: "ADMIN",
//       },
//       select: {
//         id: true,
//       },
//     });

//     if (admins.length === 0) {
//       return;
//     }

//     return await prisma.notification.createMany({
//       data: admins.map((admin) => ({
//         userId: admin.id,
//         title,
//         message,
//         type,
//       })),
//     });
//   } catch (error) {
//     console.error("Notify Admins Error:", error);
//     throw error;
//   }
// };

// module.exports = {
//   notifyUser,
//   notifyUsers,
//   notifyAdmins,
//   NotificationType,
// };

const { PrismaClient, NotificationType } = require("@prisma/client");

const prisma = new PrismaClient();

// ==========================================
// CREATE NOTIFICATION FOR A SINGLE USER
// ==========================================
const notifyUser = async ({
  userId,
  title,
  message,
  type,
}) => {
  try {
    return await prisma.userNotification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  } catch (error) {
    console.error("Notify User Error:", error);
    throw error;
  }
};

// ==========================================
// CREATE NOTIFICATIONS FOR MULTIPLE USERS
// ==========================================
const notifyUsers = async ({
  userIds,
  title,
  message,
  type,
}) => {
  try {
    if (!userIds || userIds.length === 0) {
      return;
    }

    return await prisma.userNotification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        type,
      })),
    });
  } catch (error) {
    console.error("Notify Users Error:", error);
    throw error;
  }
};

// ==========================================
// CREATE NOTIFICATION FOR ALL ADMINS
// ==========================================
const notifyAdmins = async ({
  title,
  message,
  type,
}) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
      },
    });

    if (admins.length === 0) {
      return;
    }

    return await prisma.userNotification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title,
        message,
        type,
      })),
    });
  } catch (error) {
    console.error("Notify Admins Error:", error);
    throw error;
  }
};

module.exports = {
  notifyUser,
  notifyUsers,
  notifyAdmins,
  NotificationType,
};