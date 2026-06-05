import { TrafficClient } from '@/featured/traffic/components/TrafficClient'
import {
  getFirstUserChannel,
  getPagePerformance,
  getFrictionIndex,
  getSurvivalRate,
} from '@/featured/traffic/services/traffic.service'
import { PageHeader } from '@/shared/components/PageHeader'

export default async function TrafficPage() {
  const [firstChannelResult, pagePerformanceResult, frictionIndexResult, survivalRateResult] =
    await Promise.all([
      getFirstUserChannel(),
      getPagePerformance(),
      getFrictionIndex(),
      getSurvivalRate(),
    ])

  console.log('이탈률 데이터:', frictionIndexResult)

  return (
    <div>
      <PageHeader title="트래픽 관리" description="ga4로 유저 유입/이탈을 관리합니다." />
      <div className="-mx-6">
        <TrafficClient
          firstChannelResult={firstChannelResult ?? []}
          pagePerformanceResult={(pagePerformanceResult ?? []).map((row) => ({
            ...row,
            pagePath: row.pagePath ?? '',
          }))}
          frictionIndexResult={frictionIndexResult ?? []}
          survivalRateResult={survivalRateResult ?? []}
        />
      </div>
    </div>
  )
}
