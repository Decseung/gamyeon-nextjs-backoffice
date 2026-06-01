'use client'

import { motion } from 'framer-motion'
import { Flame, AlertTriangle, TrendingDown, ShieldCheck } from 'lucide-react'
import { EmptyState } from '@/shared/components/EmptyState'
import { FrictionRanking } from '../types/index'

interface FrictionBoardProps {
  data: FrictionRanking[]
}

// UX 설명 헬퍼 함수
const getUxDesc = (title: string) => {
  if (title.includes('질문 생성')) return '질문 생성 대기 중 지루함을 느껴 뒤로가기 또는 이탈 발생'
  if (title.includes('리포트 분석'))
    return '분석 중 화면이 멈춘 것으로 오해하여 새로고침 또는 이탈 발생'
  if (title.includes('화면 이탈')) return '대기 시간이 길어 지루함을 느끼고 다른 탭으로 시선을 돌림'
  return '화면 대기 중 사용자가 피로도를 느껴 이탈했습니다.'
}

export function FrictionBoard({ data }: FrictionBoardProps) {
  return (
    <div className="border-border bg-card flex h-full flex-col rounded-2xl border p-6">
      {/* 헤더 영역 */}
      <div className="mb-6 shrink-0">
        <h2 className="text-foreground text-xl font-bold">AI 대기 구간 유저 마찰 지표 Top 3 </h2>
        <p className="text-muted-foreground mt-1.5 text-sm break-keep">
          가장 이탈이 심한 화면을 순위로 노출하여, 다음 스프린트의 최우선 해결 과제로 삼습니다.
        </p>
      </div>

      {/* 리스트 영역 */}
      <div className="flex min-h-0 flex-1 flex-col space-y-4">
        {/* 데이터가 없을 때 */}
        {data.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="마찰 데이터가 없습니다"
            description="이탈률 데이터가 수집되면 순위가 표시됩니다"
          />
        ) : (
          data.map((stat, index) => {
            // 외부로 뺀 함수를 여기서 호출해서 사용
            const desc = getUxDesc(stat.title)
            const rankText = String(index + 1).padStart(2, '0')

            let Icon = TrendingDown
            let badgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'

            if (index === 0) {
              Icon = Flame
              badgeClass = 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500'
            } else if (index === 1) {
              Icon = AlertTriangle
              badgeClass = 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500'
            }

            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="border-border bg-background flex items-center rounded-xl border p-4 transition-shadow hover:shadow-md"
              >
                <div className="text-primary mr-4 w-10 text-center text-3xl font-black tracking-tighter italic opacity-30">
                  {rankText}
                </div>

                <div className="scrollbar-hide flex-1 overflow-x-auto overflow-y-hidden">
                  <h3 className="text-foreground text-sm font-bold whitespace-nowrap">
                    {stat.title}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-xs whitespace-nowrap">{desc}</p>
                </div>

                <div
                  className={`ml-3 flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold ${badgeClass}`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
                  {stat.dropOffRate}% 이탈률
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
