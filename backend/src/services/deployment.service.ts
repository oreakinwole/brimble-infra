import { prisma } from "../db";

export const createDeployment = async (data: {
  sourceType: string;
  source: string;
}) => {
  return prisma.deployment.create({
    data: {
      ...data,
      status: "pending",
    },
  });
};

export const countDeployments = async () => {
  return prisma.deployment.count();
};

export const listDeployments = async () => {
  return prisma.deployment.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const getDeploymentById = async (id: string) => {
  return prisma.deployment.findUnique({
    where: { id },
  });
};

export const updateDeploymentStatus = async (
  id: string,
  status: string,
  extra?: { imageTag?: string; url?: string }
) => {
  return prisma.deployment.update({
    where: { id },
    data: {
      status,
      ...extra,
    },
  });
};
