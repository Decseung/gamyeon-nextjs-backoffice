'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { EventCountData } from '@/featured/traffic/types'

const STEP_MAP: { eventName: string; label: string }[] = [
  { eventName: 'open_interview_modal', label: '모달 진입' },
  { eventName: 'complete_title_input', label: '제목 입력' },
  { eventName: 'enter_upload_step', label: '파일 업로드' },
  { eventName: 'upload_s3_success', label: '업로드 성공' },
  { eventName: 'request_cam_permission', label: '카메라 권한' },
  { eventName: 'request_mic_permission', label: '마이크 권한' },
  { eventName: 'start_interview', label: '인터뷰 시작' },
  { eventName: 'complete_interview', label: '인터뷰 종료' },
]

function getStepColor(rate: number): string {
  if (rate >= 80) return 'oklch(0.55 0.15 180)'
  if (rate >= 60) return 'oklch(0.60 0.15 180)'
  if (rate >= 40) return 'oklch(0.72 0.18 150)'
  return 'oklch(0.62 0.15 25)'
}

type ChartRow = { step: string; count: number; rate: number; previousRate?: number }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload as ChartRow
  const dropRate = data.previousRate != null ? +(data.previousRate - data.rate).toFixed(1) : 0
  console.log(`data.count!!!: `, data)
  return (
    <div className="bg-background border-border rounded-lg border p-3 text-sm shadow-md">
      <p className="font-semibold">{data.step} 단계</p>
      <p className="text-muted-foreground mt-1">{data.count}명</p>
      <p style={{ color: getStepColor(data.rate) }} className="font-medium">
        생존율 {data.rate}%
      </p>
      {dropRate > 0 && (
        <p className="text-destructive mt-1 text-xs">이전 단계 대비 -{dropRate}%p 이탈</p>
      )}
    </div>
  )
}

interface SurvivalRateChartProps {
  data: EventCountData[]
}

export function SurvivalRateChart({ data }: SurvivalRateChartProps) {
  const countMap = Object.fromEntries(data.map((e) => [e.eventName, e.eventCount]))
  const baseline = countMap['open_interview_modal'] ?? 0

  const chartData: ChartRow[] = STEP_MAP.filter((s) => countMap[s.eventName] !== undefined).map(
    (s, index, arr) => {
      const prev = arr[index - 1]
      return {
        step: s.label,
        count: countMap[s.eventName],
        rate: baseline > 0 ? Number(((countMap[s.eventName] / baseline) * 100).toFixed(1)) : 0,
        previousRate:
          prev && baseline > 0
            ? Number(((countMap[prev.eventName] / baseline) * 100).toFixed(1))
            : undefined,
      }
    },
  )

  const worstDrop = chartData.reduce(
    (worst, item) => {
      const drop = (item.previousRate ?? 0) - item.rate
      return drop > (worst?.drop ?? 0) ? { step: item.step, drop } : worst
    },
    null as { step: string; drop: number } | null,
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex h-full w-full"
      suppressHydrationWarning
    >
      <Card className="border-border/60 h-full w-full">
        <CardHeader className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground text-xl font-bold">단계별 생존율</CardTitle>
              <p className="text-muted-foreground text-xs">면접 셋업 ~ 완료 · 최근 7일</p>
            </div>
            {worstDrop && (
              <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-medium">
                {worstDrop.step} 구간 주의 📉
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-5 pt-0 pb-4">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 48, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="oklch(0.91 0.01 180)"
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 11, fill: 'oklch(0.55 0.02 180)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="step"
                tick={{ fontSize: 12, fill: 'oklch(0.4 0.02 180)' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(0.96 0.01 180)' }} />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]} maxBarSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={getStepColor(entry.rate)} />
                ))}
                <LabelList
                  dataKey="rate"
                  position="right"
                  formatter={(value: number) => `${value}%`}
                  style={{ fontSize: 12, fontWeight: 600, fill: 'oklch(0.4 0.02 180)' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {worstDrop && (
            <div className="bg-secondary mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5">
              <span className="text-sm leading-none">💡</span>
              <p className="text-secondary-foreground text-xs">
                <strong>인사이트:</strong> {worstDrop.step} 구간에서 이탈률이{' '}
                {worstDrop.drop.toFixed(1)}%p 급증합니다. 해당 구간의 UX를 점검해야 합니다.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
