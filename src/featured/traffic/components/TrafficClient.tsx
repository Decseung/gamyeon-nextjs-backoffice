'use client'

import { ChannelPerformanceTabs } from '@/featured/traffic/components/ChannelPerformanceTabs'
import type {
  ChannelData,
  EventCountData,
  FrictionRanking,
  PagePerformanceData,
} from '@/featured/traffic/types'
import { FrictionBoard } from '@/featured/traffic/components/FrictionBoard'
import { SurvivalRateChart } from '@/featured/traffic/components/SurvivalRateChart'

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
    <div className="mt-4 flex h-full flex-col gap-5 px-4">
      <div className="flex flex-1 gap-5">
        <div className="flex-1">
          {/* 유입 채널, 페이지별 성과 */}
          <ChannelPerformanceTabs
            channelData={firstChannelResult}
            performanceData={pagePerformanceResult}
          />
        </div>
        <div className="flex-1">
          {/* UX 마찰 랭킹 리스트 */}
          <FrictionBoard data={frictionIndexResult} />
        </div>
      </div>
      <div className="flex flex-1 gap-5">
        <div className="flex-1">
          {/* 단계별 생존율 */}
          <SurvivalRateChart data={survivalRateResult} />
        </div>
        <div className="flex-1" />
      </div>
    </div>
  )
}
