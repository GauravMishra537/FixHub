package com.fixhub.user.dto;

public class AdminOverviewDto {

    private long totalUsers;
    private long activeUsers;
    private long pendingUsers;
    private long adminCount;
    private String systemStatus;

    public AdminOverviewDto() {
    }

    public AdminOverviewDto(long totalUsers, long activeUsers, long pendingUsers, long adminCount, String systemStatus) {
        this.totalUsers = totalUsers;
        this.activeUsers = activeUsers;
        this.pendingUsers = pendingUsers;
        this.adminCount = adminCount;
        this.systemStatus = systemStatus;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public long getPendingUsers() {
        return pendingUsers;
    }

    public void setPendingUsers(long pendingUsers) {
        this.pendingUsers = pendingUsers;
    }

    public long getAdminCount() {
        return adminCount;
    }

    public void setAdminCount(long adminCount) {
        this.adminCount = adminCount;
    }

    public String getSystemStatus() {
        return systemStatus;
    }

    public void setSystemStatus(String systemStatus) {
        this.systemStatus = systemStatus;
    }
}
