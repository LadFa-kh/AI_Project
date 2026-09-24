package com.example.backend.user.account;

import com.example.backend.handle.BusinessException;
import com.example.backend.user.entity.UserEntity;

/** B5: ตรวจสถานะบัญชีก่อนออก token — ใช้ร่วมกันทั้ง login ปกติและ Google */
public final class AccountGuard {

    private AccountGuard() {}

    public static void requireActive(UserEntity user) {
        switch (user.effectiveStatus()) {
            case PENDING -> throw BusinessException.forbidden("EMPLOYER_PENDING",
                    "บัญชีผู้ประกาศงานของคุณกำลังรอผู้ดูแลระบบอนุมัติ");
            case REJECTED -> throw BusinessException.forbidden("EMPLOYER_REJECTED",
                    "บัญชีผู้ประกาศงานไม่ผ่านการอนุมัติ" + reason(user));
            case SUSPENDED -> throw BusinessException.forbidden("ACCOUNT_SUSPENDED",
                    "บัญชีนี้ถูกระงับการใช้งาน" + reason(user));
            default -> { }
        }
    }

    private static String reason(UserEntity u) {
        return u.getStatusReason() == null || u.getStatusReason().isBlank() ? "" : " (เหตุผล: " + u.getStatusReason() + ")";
    }
}
