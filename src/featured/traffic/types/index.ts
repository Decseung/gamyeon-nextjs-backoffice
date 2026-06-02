export type ChannelData = {
  channel: string
  totalUsers: number
}

export type PagePerformanceData = {
  pagePath: string
  pageViews: number
  activeUsers: number
  userDurations: number
}

export type FrictionRanking = {
  id: number
  title: string
  dropOffRate: number
  rateLabel?: '이탈률' | '마찰률'
}
