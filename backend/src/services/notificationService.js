
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
//     return await prisma.userNotification.create({
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

//     return await prisma.userNotification.createMany({
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
//   companyId,
//   title,
//   message,
//   type,
// }) => {
//   try {
//     // SECURITY: admins are notified only inside their own company.
//     // If no companyId is supplied, send nothing (never broadcast to
//     // the admins of every company).
//     if (companyId === undefined || companyId === null) {
//       console.error("Notify Admins skipped: companyId is required");
//       return;
//     }

//     const admins = await prisma.user.findMany({
//       where: {
//         role: "ADMIN",
//         companyId,
//       },
//       select: {
//         id: true,
//       },
//     });

//     if (admins.length === 0) {
//       return;
//     }

//     return await prisma.userNotification.createMany({
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
const { emitToUser } = require("../socket");

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
    const notification = await prisma.userNotification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });

    // Live push to the user's open browser tab(s) so the bell updates
    // instantly. Never throws, so saving the notification is never affected.
    emitToUser(userId, "notification:new", notification);

    return notification;
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
  companyId,
  title,
  message,
  type,
}) => {
  try {
    // SECURITY: admins are notified only inside their own company.
    // If no companyId is supplied, send nothing (never broadcast to
    // the admins of every company).
    if (companyId === undefined || companyId === null) {
      console.error("Notify Admins skipped: companyId is required");
      return;
    }

    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        companyId,
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