// // src/pages/Auth/EmailVerificationPage.tsx

// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FaEnvelopeOpenText } from 'react-icons/fa';

// export default function EmailVerificationPage() {
//   const navigate = useNavigate();

//   const handleVerifyComplete = () => {
//     alert('이메일 인증이 완료되었습니다.');
//     navigate('/login');
//   };

//   const handleResendEmail = () => {
//     alert('인증 메일이 재전송되었습니다. 메일함을 확인해주세요.');
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FBFB] p-6">
//       <div className="flex flex-col items-center text-center bg-white rounded-xl shadow-md p-8 w-full max-w-md">
//         <FaEnvelopeOpenText className="text-mint text-5xl mb-4" />
//         <h1 className="text-2xl font-bold text-dark-gray mb-2">이메일 인증 대기</h1>
//         <p className="text-gray-600 text-sm leading-relaxed mb-6">
//           회원가입이 완료되었습니다.<br />
//           가입하신 이메일로 인증 링크가 발송되었습니다.<br />
//           메일함에서 인증 링크를 클릭하신 후 아래 버튼을 눌러주세요.
//         </p>

//         <button
//           onClick={handleVerifyComplete}
//           className="w-full bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
//         >
//           인증 완료
//         </button>

//         <button
//           onClick={handleResendEmail}
//           className="w-full mt-3 bg-white border border-mint text-mint font-semibold py-3 px-4 rounded-lg hover:bg-mint/10 transition-colors duration-200"
//         >
//           인증 메일 재전송
//         </button>

//         <button
//           onClick={() => navigate('/login')}
//           className="mt-3 text-sm text-gray-500 hover:text-mint"
//         >
//           로그인 페이지로 돌아가기
//         </button>
//       </div>

//       <p className="text-gray-400 text-xs mt-6">© 2025 메디노트</p>
//     </div>
//   );
// }
