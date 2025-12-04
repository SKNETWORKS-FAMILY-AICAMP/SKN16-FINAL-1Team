// src/pages/Auth/SignupPage.tsx

import React, { useState } from "react";
import { FaHeart } from "react-icons/fa";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import FindPasswordModal from "../../components/domain/Auth/FindPasswordModal";

// ✅ authAPI 사용
import { signup as signupAPI } from "../../api/authAPI";

export default function SignupPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<"terms" | "form">("terms");
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeSensitive, setAgreeSensitive] = useState(false);
  const [agreeDisclaimer, setAgreeDisclaimer] = useState(false);
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);
  const [agreeBackup, setAgreeBackup] = useState(false); // optional

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const canProceed = agreeSensitive && agreeDisclaimer && agreeAccuracy;

  const toggleAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeSensitive(checked);
    setAgreeDisclaimer(checked);
    setAgreeAccuracy(checked);
    setAgreeBackup(checked);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FBFB] p-4">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-3">
          <FaHeart className="text-mint text-3xl" />
        </div>
        <h1 className="text-2xl font-bold text-dark-gray">메디노트</h1>
        <p className="text-gray-500">나의 건강을 한 곳에서</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-8">
        {step === "terms" ? (
          <div>
            <h2 className="text-lg font-bold text-dark-gray mb-4">
              약관 동의
            </h2>

            <label className="flex items-start gap-2 p-3 rounded-lg border border-mint bg-mint/5 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={agreeAll}
                onChange={(e) => toggleAll(e.target.checked)}
                className="mt-1"
              />
              <span className="font-semibold text-mint">전체 동의</span>
            </label>

            <div className="space-y-3 max-h-72 overflow-auto pr-1">
              <TermsItem
                required
                label="민감정보 수집 및 이용 동의"
                checked={agreeSensitive}
                onChange={(v) => {
                  setAgreeSensitive(v);
                  setAgreeAll(
                    v && agreeDisclaimer && agreeAccuracy && agreeBackup
                  );
                }}
                content={
                  <>
                    <p>
                      본 서비스는 사용자의 건강 관리 및 맞춤형 서비스 제공을
                      위하여, 질병 정보, 복용 약 정보, 알러지 정보, 진료 기록
                      등 「개인정보 보호법」상 ‘민감정보’에 해당하는 항목을
                      수집·이용합니다.
                    </p>
                    <p className="mt-2">
                      회원가입을 진행함으로써 귀하는 상기 민감정보의 수집,
                      이용, 및 처리를 허용하는 것에 명시적으로 동의한 것으로
                      간주됩니다.
                    </p>
                  </>
                }
              />
              <TermsItem
                required
                label="의료 면책 조항 동의"
                checked={agreeDisclaimer}
                onChange={(v) => {
                  setAgreeDisclaimer(v);
                  setAgreeAll(
                    v && agreeSensitive && agreeAccuracy && agreeBackup
                  );
                }}
                content={
                  <>
                    <p>
                      본 서비스에서 제공하는 AI 기반 답변, 음성 요약, 건강분석
                      리포트 및 기타 정보는 사용자의 편의를 위한 참고 자료일
                      뿐이며, 의사·약사 등 전문 의료인의 진단, 처방, 또는
                      의학적 조언을 대체하지 않습니다.
                    </p>
                    <p className="mt-2">
                      건강상 이상 또는 질환이 의심되는 경우, 반드시 전문
                      의료기관을 방문하여 의료 전문가와 상담하시기 바랍니다.
                    </p>
                    <p className="mt-2">
                      본 서비스는 의료행위를 제공하지 않으며, 사용자가 AI
                      답변을 신뢰함으로써 발생하는 어떠한 결과에 대해서도
                      법적 책임을 부담하지 않습니다.
                    </p>
                  </>
                }
              />
              <TermsItem
                required
                label="데이터의 정확성 및 책임"
                checked={agreeAccuracy}
                onChange={(v) => {
                  setAgreeAccuracy(v);
                  setAgreeAll(
                    v && agreeSensitive && agreeDisclaimer && agreeBackup
                  );
                }}
                content={
                  <>
                    <p>
                      본 서비스에 입력되는 건강정보(질환, 증상, 복용량, 약품명
                      등)는 사용자가 직접 입력한 내용을 기반으로 합니다.
                    </p>
                    <p className="mt-2">
                      사용자가 부정확하거나 오래된 정보를 입력함으로써 발생하는
                      결과, 오류, 또는 불이익에 대해서는 전적으로 사용자
                      본인에게 책임이 있습니다.
                    </p>
                    <p className="mt-2">
                      회사는 사용자가 입력한 데이터의 정확성, 완전성, 최신성에
                      대해 보증하지 않습니다.
                    </p>
                  </>
                }
              />
              <TermsItem
                label="데이터 유실 및 백업 관련"
                checked={agreeBackup}
                onChange={(v) => {
                  setAgreeBackup(v);
                  setAgreeAll(
                    v && agreeSensitive && agreeDisclaimer && agreeAccuracy
                  );
                }}
                content={
                  <>
                    <p>
                      회사는 사용자의 데이터가 안전하게 저장되도록 합리적인
                      기술적·관리적 조치를 취합니다.
                    </p>
                    <p className="mt-2">
                      그러나 서버 오류, 시스템 장애, 또는 예기치 못한 기술적
                      문제로 인해 데이터가 유실될 가능성이 있습니다.
                    </p>
                    <p className="mt-2">
                      본 서비스는 이를 대비하여 PDF 내보내기 기능을 제공합니다.
                    </p>
                    <p className="mt-2">
                      따라서 사용자는 중요한 건강 정보를 주기적으로 직접
                      내보내시기를 권장합니다.
                    </p>
                    <p className="mt-2">
                      회사는 고의 또는 중대한 과실이 없는 한, 데이터 유실로
                      인한 손해에 대해 책임을 부담하지 않습니다.
                    </p>
                  </>
                }
              />
            </div>

            <button
              disabled={!canProceed}
              onClick={() => setStep("form")}
              className={`w-full mt-5 font-bold py-3 px-4 rounded-lg transition-colors	duration-200 ${
                canProceed
                  ? "bg-mint hover:bg-mint-dark text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              동의하고 계속하기
            </button>

            <div className="text-center mt-4">
              <Link
                to="/login"
                className="text-sm text-gray-500 hover:text-mint"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          </div>
        ) : (
          <SignupForm onBack={() => setStep("terms")} />
        )}
      </div>

      <p className="text-center text-gray-400 text-xs mt-8">
        © 2025 메디노트
      </p>
      {isModalOpen && <FindPasswordModal onClose={closeModal} />}
    </div>
  );
}

// ===================== 실제 회원가입 폼 + API 호출 부분 =====================

function SignupForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [name, setName] = React.useState("");

  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
    confirm?: string;
    name?: string;
  }>({});
  const [touched, setTouched] = React.useState<{
    email?: boolean;
    password?: boolean;
    confirm?: boolean;
    name?: boolean;
  }>({});
  const [submitting, setSubmitting] = React.useState(false);

  // --- 유효성 검사 함수 ---
  const validateEmail = (v: string) => {
    if (!v.trim()) return "이메일을 입력해주세요";
    if (!/.+@.+\..+$/i.test(v)) return "유효한 이메일 형식이 아닙니다";
    return undefined;
  };
  const validatePassword = (v: string) => {
    if (!v) return "비밀번호를 입력해주세요";
    if (v.length < 8 || v.length > 20)
      return "비밀번호는 8자 이상 20자 이하로 입력해주세요";
    const hasLetter = /[A-Za-z]/.test(v);
    const hasNumber = /[0-9]/.test(v);
    const hasSpecial = /[^A-Za-z0-9]/.test(v);
    if (!(hasLetter && hasNumber && hasSpecial))
      return "비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다";
    return undefined;
  };
  const validateConfirm = (c: string, p: string) => {
    if (!c) return "비밀번호를 다시 확인해주세요";
    if (c !== p) return "비밀번호가 일치하지 않습니다";
    return undefined;
  };
  const validateName = (v: string) => {
    const t = v.trim();
    if (!t) return "이름을 입력해주세요";
    if (t.length < 2 || t.length > 20)
      return "이름은 2자 이상 20자 이하로 입력해주세요";
    if (!/^[A-Za-z가-힣\s]+$/.test(t))
      return "이름에는 특수문자나 숫자를 사용할 수 없습니다";
    return undefined;
  };

  const setFieldError = (key: keyof typeof errors, msg?: string) =>
    setErrors((prev) => ({ ...prev, [key]: msg }));

  const isEmailValid = !validateEmail(email);
  const isPasswordValid = !validatePassword(password);
  const isConfirmValid = !validateConfirm(confirm, password);
  const isNameValid = !validateName(name);

  const handleBlur = (key: keyof typeof errors) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    if (key === "email") setFieldError("email", validateEmail(email));
    if (key === "password")
      setFieldError("password", validatePassword(password));
    if (key === "confirm")
      setFieldError("confirm", validateConfirm(confirm, password));
    if (key === "name") setFieldError("name", validateName(name));
  };

  // live update
  const onEmailChange = (v: string) => {
    setEmail(v);
    if (touched.email) setFieldError("email", validateEmail(v));
  };
  const onPasswordChange = (v: string) => {
    setPassword(v);
    if (touched.password) setFieldError("password", validatePassword(v));
    if (touched.confirm) setFieldError("confirm", validateConfirm(confirm, v));
  };
  const onConfirmChange = (v: string) => {
    setConfirm(v);
    if (touched.confirm) setFieldError("confirm", validateConfirm(v, password));
  };
  const onNameChange = (v: string) => {
    setName(v);
    if (touched.name) setFieldError("name", validateName(v));
  };

  // ✅ 회원가입 API 호출(authAPI 사용)
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // 1) 프론트 유효성 검사
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validateConfirm(confirm, password),
      name: validateName(name),
    };
    setErrors(nextErrors);
    setTouched({ email: true, password: true, confirm: true, name: true });

    const hasError = Object.values(nextErrors).some((m) => !!m);
    if (hasError) return;

    setSubmitting(true);

    try {
      await signupAPI({
        email,
        password,
        name,
      });

      toast.success("회원가입이 완료되었습니다. 로그인해 주세요.");
      navigate("/login");
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 409) {
        setFieldError("email", "이미 등록된 이메일입니다.");
        toast.error("이미 사용 중인 이메일입니다.");
      } else if (status === 400) {
        toast.error("회원가입 정보가 올바르지 않습니다.");
      } else {
        console.error(error);
        toast.error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      {/* 이메일 */}
      <div className="mb-4">
        <label
          className="block text-sm font-bold text-dark-gray mb-2"
          htmlFor="email"
        >
          이메일
        </label>
        <div className="relative">
          <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="이메일을 입력하세요"
            className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
          />
          {isEmailValid && touched.email && (
            <HiOutlineCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
          )}
        </div>
        {touched.email && errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email}</p>
        )}
      </div>

      {/* 비밀번호 */}
      <div className="mb-4">
        <label
          className="block text-sm font-bold text-dark-gray mb-2"
          htmlFor="password"
        >
          비밀번호
        </label>
        <div className="relative">
          <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onBlur={() => handleBlur("password")}
            placeholder="비밀번호를 입력하세요"
            className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
          />
          {isPasswordValid && touched.password && (
            <HiOutlineCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
          )}
        </div>
        {touched.password && errors.password && (
          <p className="text-xs text-red-500 mt-1">{errors.password}</p>
        )}
      </div>

      {/* 비밀번호 확인 */}
      <div className="mb-4">
        <label
          className="block text-sm font-bold text-dark-gray mb-2"
          htmlFor="confirm"
        >
          비밀번호 확인
        </label>
        <div className="relative">
          <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            id="confirm"
            value={confirm}
            onChange={(e) => onConfirmChange(e.target.value)}
            onBlur={() => handleBlur("confirm")}
            placeholder="비밀번호를 다시 입력하세요"
            className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
          />
          {isConfirmValid && touched.confirm && (
            <HiOutlineCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
          )}
        </div>
        {touched.confirm && errors.confirm && (
          <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>
        )}
      </div>

      {/* 이름 */}
      <div className="mb-6">
        <label
          className="block text-sm font-bold text-dark-gray mb-2"
          htmlFor="name"
        >
          이름
        </label>
        <div className="relative">
          <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => handleBlur("name")}
            placeholder="이름을 입력하세요"
            className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
          />
          {isNameValid && touched.name && (
            <HiOutlineCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
          )}
        </div>
        {touched.name && errors.name && (
          <p className="text-xs text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "회원가입 중..." : "회원가입"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full mt-3 text-sm text-gray-500 hover:text-mint"
      >
        약관 동의로 돌아가기
      </button>
    </form>
  );
}

// ===================== 약관 아이템 컴포넌트 =====================

function TermsItem({
  label,
  content,
  required = false,
  checked,
  onChange,
}: {
  label: string;
  content: React.ReactNode;
  required?: boolean;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-dark-gray">
              {label} {required && <span className="text-mint">(필수)</span>}
            </p>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-gray-500 hover:text-mint"
              aria-label="약관 본문 토글"
            >
              {open ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
            </button>
          </div>
          {open && (
            <div className="text-xs text-gray-500 mt-2 leading-relaxed">
              {content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
