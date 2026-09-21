"use client";

// ปุ่มเข้าสู่ระบบด้วย Google
//
// ปุ่มนี้ถูกเรนเดอร์โดย Google Identity Services เอง (renderButton) ไม่ใช่ปุ่ม
// ที่เราวาดขึ้นมา เนื่องจากนโยบายของ Google กำหนดให้การขอ ID Token ต้องมาจาก
// ปุ่มที่ Google ควบคุม หรือผ่านกลไก One Tap เท่านั้น การใช้ปุ่มของเราเองแล้ว
// เรียก prompt() ทำให้ถูกระงับบ่อยครั้งเมื่อเบราว์เซอร์บล็อก third-party cookie
//
// ระหว่างที่ SDK ยังโหลดไม่เสร็จ จะแสดงกรอบจำลองไว้ก่อนเพื่อไม่ให้หน้าเว็บกระตุก

type GoogleSignInButtonProps = {
  /** ref ของกล่องที่ Google จะเรนเดอร์ปุ่มลงไป ได้จาก useGoogleSignIn() */
  containerRef: React.RefObject<HTMLDivElement | null>;
  isReady?: boolean;
  disabled?: boolean;
};

export function GoogleSignInButton({
  containerRef,
  isReady = false,
  disabled = false,
}: GoogleSignInButtonProps) {
  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className={`flex w-full justify-center ${
          disabled ? "pointer-events-none opacity-50" : ""
        } ${isReady ? "" : "hidden"}`}
      />
      {!isReady && (
        <div className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent" />
          กำลังโหลด Google Sign-In…
        </div>
      )}
    </div>
  );
}
