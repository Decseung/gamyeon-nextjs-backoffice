'use client'

import { ChannelPerformanceTabs } from '@/featured/traffic/components/ChannelPerformanceTabs'
import type { ChannelData, EventCountData, PagePerformanceData } from '@/featured/traffic/types'
import { FrictionBoard } from '@/featured/traffic/components/FrictionBoard'
import { SurvivalRateChart } from '@/featured/traffic/components/SurvivalRateChart'
import { FrictionRanking } from '../types/index'

interface TrafficClientProps {
  firstChannelResult: ChannelData[]
  pagePerformanceResult: PagePerformanceData[]
  frictionIndexResult: FrictionRanking[]
  survivalRateResult: EventCountData[]
}

export function TrafficClient({
  firstChannelResult,
  pagePerformanceResult,
  frictionIndexResult,
  survivalRateResult,
}: TrafficClientProps) {
  return (
    <div className="mt-4 grid h-full grid-cols-2 grid-rows-2 gap-5 px-4">
      <div className="">
        {/* 유입 채널, 페이지별 성과 */}
        <ChannelPerformanceTabs
          channelData={firstChannelResult}
          performanceData={pagePerformanceResult}
        />
      </div>
      <div className="row-span-2">
        {/* 단계별 생존율 */}
        <SurvivalRateChart data={survivalRateResult} />
      </div>
      <div className="">
        {/* UX 마찰 랭킹 리스트 */}
        <FrictionBoard data={frictionIndexResult} />
      </div>
    </div>
  )
}
