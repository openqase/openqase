'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ExternalLink, Github, FileText } from 'lucide-react'
import { formatHardwareModality } from '@/lib/hardware-modality'

interface BaseContentItem {
  id: string
  name: string
  slug: string
  description?: string | null
  published: boolean | null
  website_url?: string | null
  documentation_url?: string | null
  github_url?: string | null
}

interface QuantumSoftware extends BaseContentItem {
  vendor?: string | null
  license_type?: string | null
  pricing_model?: string | null
}

interface QuantumHardware extends BaseContentItem {
  vendor?: string | null
  technology_type?: string | null
}

interface QuantumCompany extends BaseContentItem {
  industry?: string | null
  company_type?: string | null
}

interface PartnerCompany extends BaseContentItem {
  industry?: string | null
  company_size?: string | null
}

type ContentItem = QuantumSoftware | QuantumHardware | QuantumCompany | PartnerCompany

interface GridViewProps {
  items: ContentItem[]
  contentType: 'quantum-software' | 'quantum-hardware' | 'quantum-companies' | 'partner-companies'
  basePath: string
}

function getSecondaryInfo(item: ContentItem, contentType: string) {
  switch (contentType) {
    case 'quantum-software':
      return (item as QuantumSoftware).vendor
    case 'quantum-hardware':
      return (item as QuantumHardware).vendor
    case 'quantum-companies':
    case 'partner-companies':
      return (item as QuantumCompany | PartnerCompany).industry
    default:
      return null
  }
}

function getBadges(item: ContentItem, contentType: string) {
  const badges: string[] = []
  
  switch (contentType) {
    case 'quantum-software':
      const software = item as QuantumSoftware
      if (software.license_type) badges.push(software.license_type)
      if (software.pricing_model) badges.push(software.pricing_model)
      break
    case 'quantum-hardware':
      const hardware = item as QuantumHardware
      if (hardware.technology_type) {
        badges.push(formatHardwareModality(hardware.technology_type) ?? hardware.technology_type)
      }
      break
    case 'quantum-companies':
      const qCompany = item as QuantumCompany
      if (qCompany.company_type) badges.push(qCompany.company_type)
      break
    case 'partner-companies':
      const pCompany = item as PartnerCompany
      if (pCompany.company_size) badges.push(pCompany.company_size)
      break
  }
  
  return badges
}

export function GridView({ items, contentType, basePath }: GridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const secondaryInfo = getSecondaryInfo(item, contentType)
        const badges = getBadges(item, contentType)
        
        return (
          <Link key={item.id} href={`${basePath}/${item.slug}`} className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg hover:text-primary transition-colors">
                      {item.name}
                    </CardTitle>
                  {secondaryInfo && (
                    <CardDescription className="mt-1">
                      by {secondaryInfo}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {item.description}
              </p>
              
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {badges.map((badge) => (
                    <Badge key={badge} variant="outline" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                {item.website_url && (
                  <a
                    href={item.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Website
                  </a>
                )}
                {item.documentation_url && (
                  <a
                    href={item.documentation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Docs
                  </a>
                )}
                {item.github_url && (
                  <a
                    href={item.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    <Github className="h-3 w-3" />
                    GitHub
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
          </Link>
        )
      })}
    </div>
  )
}