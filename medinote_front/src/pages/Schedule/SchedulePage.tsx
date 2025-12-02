// src/pages/Schedule/SchedulePage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import AddScheduleModal from "../../components/domain/Schedule/AddScheduleModal";
import ScheduleDetailModal from "../../components/domain/Schedule/ScheduleDetailModal";
import useScheduleStore, { type ScheduleItem } from "../../store/useScheduleStore";
import { kstYmd } from "../../utils/date";
import { HiOutlinePlus } from "react-icons/hi";
import {
  getSchedules,
  createSchedule,
  updateSchedule as updateScheduleAPI,
  deleteSchedule as deleteScheduleAPI,
  type ScheduleResponse,
} from "../../api/schedule";
import { toast } from "react-toastify";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function SchedulePage() {
  const [date, setDate] = useState<Value>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null);
  const [detailItem, setDetailItem] = useState<ScheduleItem | null>(null);

  const { schedules } = useScheduleStore();

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await getSchedules();
        useScheduleStore.setState({
          schedules: data.map(mapScheduleResponseToItem),
        });
      } catch (err) {
        console.error("일정 목록 불러오기 실패:", err);
        toast.error("일정을 불러오지 못했습니다.");
      }
    };
    fetchSchedules();
  }, []);

  const selectedDateStr = date instanceof Date ? kstYmd(date) : "";
  const daySchedules = useMemo(
    () =>
      schedules
        .filter((s) => s.date === selectedDateStr)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [schedules, selectedDateStr]
  );

  const formattedDate =
    date instanceof Date
      ? date.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "날짜를 선택하세요";

  return (
    <>
      <style>{`
        .react-calendar { 
          width: 100% !important; 
          border: none !important; 
          background: transparent !important;
          font-family: inherit; 
        }
        .react-calendar__tile { 
          height: 48px; 
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .react-calendar__month-view__days__day--weekend {
          color: #ff5a5f;
        }
        .react-calendar__tile--active {
          background: #2bddb7 !important;
          color: white !important;
          border-radius: 8px;
        }
        .react-calendar__tile--now {
          background: #e6fcf8;
          color: #111;
          border-radius: 8px;
        }
      `}</style>

      <div className="flex flex-col p-4 pb-16 space-y-4">
        <header className="w-full bg-mint/10 p-4 shadow-sm rounded-lg">
          <h2 className="text-xl font-bold text-dark-gray">일정관리</h2>
        </header>

        <section className="flex flex-col gap-4">
          {/* 캘린더 */}
          <div className="w-full bg-white rounded-lg shadow-lg p-4 flex justify-center">
            <Calendar
              onChange={setDate}
              value={date}
              locale="ko-KR"
              formatDay={(locale, d) =>
                d.toLocaleString("en", { day: "numeric" })
              }
              next2Label={null}
              prev2Label={null}
            />
          </div>

          {/* 일정 리스트 */}
          <div className="w-full bg-white rounded-lg shadow-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-dark-gray">
                {formattedDate}
              </h3>

              <button
                onClick={() => {
                  setEditItem(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1 text-sm bg-mint text-white px-4 py-2 rounded-lg font-semibold hover:bg-mint-dark transition-colors"
              >
                <HiOutlinePlus /> 추가
              </button>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {daySchedules.length > 0 ? (
                daySchedules.map((s) => (
                  <ScheduleRow
                    key={s.id}
                    item={s}
                    onClick={() => setDetailItem(s)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-sm">선택한 날짜의 일정이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* 일정 추가 / 수정 모달 */}
      {isModalOpen && (
        <AddScheduleModal
          onClose={() => setIsModalOpen(false)}
          initial={editItem || { date: selectedDateStr }}
          onSave={async (payload) => {
            try {
              if (editItem) {
                // ✅ PATCH용 payload: type, created_at, id 절대 안 보냄
                const updatePayload = {
                  title: payload.title,
                  date: payload.date,
                  time: payload.time,
                  location: payload.location ?? "",
                  memo: payload.memo ?? "",
                };

                console.log("🔼 PATCH /schedule (from AddModal):", updatePayload);

                const updated = await updateScheduleAPI(
                  editItem.id,
                  updatePayload
                );
                const mapped = mapScheduleResponseToItem(updated);
                useScheduleStore.setState((state) => ({
                  schedules: state.schedules.map((s) =>
                    s.id === mapped.id ? mapped : s
                  ),
                }));
                toast.success("일정이 수정되었습니다.");
              } else {
                // ✅ 생성용 payload: type 포함, string으로 보장
                const createPayload = {
                  title: payload.title,
                  type: payload.type!, // AddScheduleModal에서 항상 세팅
                  date: payload.date,
                  time: payload.time,
                  location: payload.location ?? "",
                  memo: payload.memo ?? "",
                };

                console.log(
                  "🔼 POST /schedule (from AddModal):",
                  createPayload
                );

                const created = await createSchedule(createPayload);
                const mapped = mapScheduleResponseToItem(created);
                useScheduleStore.setState((state) => ({
                  schedules: [...state.schedules, mapped],
                }));
                toast.success("일정이 추가되었습니다.");
              }
              setIsModalOpen(false);
            } catch (err: any) {
              console.error("일정 저장 실패:", err);
              if (err.response) {
                console.error("🔻 schedule save error detail:", err.response.data);
              }
              toast.error("일정 저장에 실패했습니다.");
            }
          }}
        />
      )}

      {/* 일정 상세 모달 */}
      {detailItem && (
        <ScheduleDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onUpdate={async (id, patch) => {
            try {
              // ✅ 여기서도 PATCH용 payload를 명시적으로 구성 (type, created_at 제거)
              const updatePayload = {
                title: patch.title ?? detailItem.title,
                date: patch.date ?? detailItem.date,
                time: patch.time ?? detailItem.time,
                location: patch.location ?? detailItem.location ?? "",
                memo: patch.memo ?? detailItem.memo ?? "",
              };

              console.log("🔼 PATCH /schedule (from DetailModal):", updatePayload);

              const updated = await updateScheduleAPI(id, updatePayload);
              const mapped = mapScheduleResponseToItem(updated);

              useScheduleStore.setState((state) => ({
                schedules: state.schedules.map((s) =>
                  s.id === mapped.id ? mapped : s
                ),
              }));
              setDetailItem(mapped);
              toast.success("일정이 수정되었습니다.");
            } catch (err: any) {
              console.error("일정 수정 실패:", err);
              if (err.response) {
                console.error("🔻 422 detail:", err.response.data);
              }
              toast.error("일정 수정에 실패했습니다.");
              throw err;
            }
          }}
          onDelete={async (id) => {
            try {
              await deleteScheduleAPI(id);
              useScheduleStore.setState((state) => ({
                schedules: state.schedules.filter((s) => s.id !== id),
              }));
              toast.success("일정이 삭제되었습니다.");
            } catch (err) {
              console.error("일정 삭제 실패:", err);
              toast.error("일정 삭제에 실패했습니다.");
              throw err;
            }
          }}
        />
      )}
    </>
  );
}

function ScheduleRow({
  item,
  onClick,
}: {
  item: ScheduleItem;
  onClick: () => void;
}) {
  const isClinic = item.type === "진료";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center p-4 rounded-xl transition-all hover:shadow-md border ${
        isClinic ? "bg-blue-50 border-blue-100" : "bg-green-50 border-green-100"
      }`}
    >
      {/* 시간 */}
      <div
        className={`w-16 text-lg font-bold text-left ${
          isClinic ? "text-blue-600" : "text-green-600"
        }`}
      >
        {item.time}
      </div>

      {/* 구분선 */}
      <div className="w-[1px] h-8 bg-gray-300 mx-4"></div>

      {/* 내용 */}
      <div className="flex-1 text-left">
        <div className="font-bold text-dark-gray text-base">
          {item.title}
        </div>

        {item.location && (
          <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            @ {item.location}
          </div>
        )}

        {/* 메모 표시 */}
        {item.memo && (
          <div className="text-xs text-gray-400 mt-1 truncate">
            {item.memo}
          </div>
        )}
      </div>
    </button>
  );
}

function mapScheduleResponseToItem(item: ScheduleResponse): ScheduleItem {
  return {
    id: item.id,
    title: item.title,
    type: item.type as ScheduleItem["type"],
    date: item.date,
    time: item.time,
    location: item.location || undefined,
    memo: item.memo || undefined,
  };
}
