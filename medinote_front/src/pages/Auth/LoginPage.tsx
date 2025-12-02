// src/pages/Auth/LoginPage.tsx

import React, {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { FaHeart } from "react-icons/fa";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import FindPasswordModal from "../../components/domain/Auth/FindPasswordModal";
import useUserStore from "../../store/useUserStore";
import { toast } from "react-toastify";

// ✅ authAPI 사용
import { login as loginAPI } from "../../api/authAPI";

type LoginFormErrors = {
  email?: string;
  password?: string;
};

const validateEmail = (email: string): string | undefined => {
  if (!email) return "이메일을 입력해주세요.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) return "유효한 이메일 형식이 아닙니다.";
};

const validatePassword = (password: string): string | undefined => {
  if (!password) return "비밀번호를 입력해주세요.";
};

export default function LoginPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Zustand에서 setAuth만 사용
  const { setAuth } = useUserStore();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target as { name: "email" | "password" };
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (name === "email") {
      setErrors((prev) => ({ ...prev, email: validateEmail(emailInput) }));
    }
    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(passwordInput),
      }));
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as {
      name: "email" | "password";
      value: string;
    };

    if (name === "email") {
      setEmailInput(value);
      if (touched.email) {
        setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
      }
    }
    if (name === "password") {
      setPasswordInput(value);
      if (touched.password) {
        setErrors((prev) => ({
          ...prev,
          password: validatePassword(value),
        }));
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setTouched({ email: true, password: true });

    const emailError = validateEmail(emailInput);
    const passwordError = validatePassword(passwordInput);

    const newErrors: LoginFormErrors = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // ✅ authAPI.login 사용
      const { user, tokens } = await loginAPI({
        email: emailInput,
        password: passwordInput,
      });

      // ✅ Zustand에 토큰 + 유저 저장
      setAuth(user, tokens);

      toast.success(`${user.name}님 환영합니다!`);

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 404) {
        setErrors({ email: "존재하지 않는 이메일입니다." });
        toast.error("존재하지 않는 이메일입니다.");
      } else if (status === 401) {
        setErrors({ password: "잘못된 비밀번호입니다." });
        toast.error("비밀번호가 올바르지 않습니다.");
      } else if (status === 400) {
        toast.error("로그인 요청이 올바르지 않습니다.");
      } else {
        console.error(error);
        toast.error("로그인 중 서버 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FBFB] p-4">
      {/* 상단 로고 */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-3">
          <FaHeart className="text-mint text-3xl" />
        </div>
        <h1 className="text-2xl font-bold text-dark-gray">메디노트</h1>
        <p className="text-gray-500">나의 건강을 한 곳에서</p>
      </div>

      {/* 로그인 카드 */}
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-8">
        <form onSubmit={handleSubmit}>
          {/* 이메일 입력 */}
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
                name="email"
                placeholder="이메일을 입력하세요"
                value={emailInput}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>
            {touched.email && errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* 비밀번호 입력 */}
          <div className="mb-6">
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
                name="password"
                placeholder="비밀번호를 입력하세요"
                value={passwordInput}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>
            {touched.password && errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:bg-gray-400"
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 하단 링크 */}
        <div className="text-center mt-6">
          <Link to="/signup" className="text-sm text-gray-500 hover:text-mint">
            회원가입
          </Link>
          <span className="mx-2 text-gray-300">|</span>
          <button
            onClick={openModal}
            className="text-sm text-gray-500 hover:text-mint"
          >
            비밀번호 찾기
          </button>
        </div>
      </div>

      <p className="text-center text-gray-400 text-xs mt-8">
        © 2025 메디노트. 보는 건강 데이터는 안전하게 보호됩니다.
      </p>

      {isModalOpen && <FindPasswordModal onClose={closeModal} />}
    </div>
  );
}
