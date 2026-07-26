import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Segmented, Spin, Button, Typography, Space } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { SegmentedValue } from 'antd/es/segmented';
import MonthView from '../../components/calendar/MonthView';
import DayView from '../../components/calendar/DayView';
import TimeGrid from '../../components/calendar/TimeGrid';
import { scheduleApi, type WeekScheduleVO, type CalendarItem } from '../../api/schedule';
import { useAppStore } from '../../stores/useAppStore';
import { formatWeekRange, getWeekDays } from '../../utils/calendar';
import dayjs from 'dayjs';

type CalendarView = 'month' | 'week' | 'day';

const CalendarPanel: React.FC = () => {
  const currentDate = useAppStore((s) => s.currentDate);
  const currentView = useAppStore((s) => s.currentView);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const setCurrentDate = useAppStore((s) => s.setCurrentDate);
  const goToPrevWeek = useAppStore((s) => s.goToPrevWeek);
  const goToNextWeek = useAppStore((s) => s.goToNextWeek);
  const goToPrevMonth = useAppStore((s) => s.goToPrevMonth);
  const goToNextMonth = useAppStore((s) => s.goToNextMonth);
  const goToToday = useAppStore((s) => s.goToToday);
  const previewSchedules = useAppStore((s) => s.previewSchedules);

  const [data, setData] = useState<WeekScheduleVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(currentDate.format('YYYY-MM-DD'));

  const weekBounds = useMemo(() => {
    const days = getWeekDays(currentDate);
    return {
      weekStart: days[0].format('YYYY-MM-DD'),
      weekEnd: days[6].format('YYYY-MM-DD'),
    };
  }, [currentDate]);

  const fetchWeek = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await scheduleApi.getWeek(date);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeek(currentDate.format('YYYY-MM-DD'));
  }, [currentDate, fetchWeek]);

  // Merge preview items
  const mergedDays = data?.days?.map((day) => {
    const dayPreviewItems = previewSchedules.filter((p) => {
      const itemDate = dayjs(p.startTime).format('YYYY-MM-DD');
      return itemDate === day.date;
    });
    if (dayPreviewItems.length === 0) return day;
    return { ...day, items: [...day.items, ...dayPreviewItems] };
  }) ?? [];

  // Build preview-only days (for month view)
  const previewDays = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    previewSchedules.forEach((p) => {
      const date = dayjs(p.startTime).format('YYYY-MM-DD');
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(p);
    });
    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      dayOfWeek: '',
      items,
    }));
  }, [previewSchedules]);

  const handleViewChange = (val: SegmentedValue) => {
    setCurrentView(val as CalendarView);
  };

  const handlePrev = () => {
    if (currentView === 'month') goToPrevMonth();
    else goToPrevWeek();
  };

  const handleNext = () => {
    if (currentView === 'month') goToNextMonth();
    else goToNextWeek();
  };

  const handleDayClick = (date: string) => {
    setSelectedDay(date);
    setCurrentDate(dayjs(date));
    setCurrentView('day');
  };

  // Title for navigation bar
  const navTitle = useMemo(() => {
    if (currentView === 'month') {
      return currentDate.format('YYYY年M月');
    }
    if (currentView === 'day') {
      return currentDate.format('YYYY年M月D日 dddd');
    }
    return formatWeekRange(weekBounds.weekStart, weekBounds.weekEnd);
  }, [currentView, currentDate, weekBounds]);

  // Day view items
  const dayItems = useMemo(() => {
    const dayData = mergedDays.find((d) => d.date === selectedDay);
    return dayData?.items ?? [];
  }, [mergedDays, selectedDay]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Segmented
          size="small"
          value={currentView}
          onChange={handleViewChange}
          options={[
            { label: '月', value: 'month' },
            { label: '周', value: 'week' },
            { label: '日', value: 'day' },
          ]}
        />
        <Space>
          <Button icon={<LeftOutlined />} size="small" onClick={handlePrev} />
          <Typography.Text strong style={{ minWidth: 140, textAlign: 'center' }}>
            {navTitle}
          </Typography.Text>
          <Button icon={<RightOutlined />} size="small" onClick={handleNext} />
          <Button size="small" onClick={goToToday}>今天</Button>
        </Space>
      </div>

      {/* Week day headers (only for week view) */}
      {currentView === 'week' && (
        <div style={{ display: 'flex', borderBottom: '2px solid #1677ff', margin: '0 16px' }}>
          <div style={{ width: 56, flexShrink: 0 }} />
          {(() => {
            const days = getWeekDays(currentDate);
            const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            const today = dayjs().format('YYYY-MM-DD');
            return days.map((d, i) => {
              const isToday = d.format('YYYY-MM-DD') === today;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '8px 4px',
                    backgroundColor: isToday ? '#e6f4ff' : 'transparent',
                    borderRadius: isToday ? '4px 4px 0 0' : 0,
                  }}
                >
                  <div style={{ fontSize: 12, color: '#999' }}>{dayNames[i]}</div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: isToday ? 700 : 400,
                    color: i >= 5 ? '#f5222d' : '#333',
                  }}>
                    {d.format('D')}
                  </div>
                  <div style={{ fontSize: 11, color: '#bbb' }}>{d.format('M')}月</div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Calendar content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Spin spinning={loading}>
          {currentView === 'month' && (
            <MonthView
              year={currentDate.year()}
              month={currentDate.month()}
              days={data?.days ?? []}
              previewDays={previewDays}
              onDayClick={handleDayClick}
            />
          )}
          {currentView === 'week' && (
            <TimeGrid days={mergedDays.length > 0 ? mergedDays : (
              getWeekDays(currentDate).map(d => ({
                date: d.format('YYYY-MM-DD'), dayOfWeek: '', items: []
              }))
            )} />
          )}
          {currentView === 'day' && (
            <DayView
              date={selectedDay}
              items={dayItems}
            />
          )}
        </Spin>
      </div>
    </div>
  );
};

export default CalendarPanel;
