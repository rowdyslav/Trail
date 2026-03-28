import type { RouteAccessType } from '../../../shared/types/game'

interface NamedRouteImage {
  image: string
  title: string
}

const namedRouteImages: NamedRouteImage[] = [
  {
    title: 'исторический центр рязани',
    image: '/img/photo/kremlin.jpg',
  },
  {
    title: 'центр рязани',
    image: '/img/photo/center.jpg',
  },
  {
    title: 'по есенинским местам',
    image: '/img/photo/Oka.jpg',
  },
  {
    title: 'прогулка по мещерскому краю',
    image: '/img/photo/ozero.jpg',
  },
]

const fallbackRouteImages: Record<RouteAccessType, string> = {
  free: '/img/photo/kremlin.jpg',
  paid: '/img/photo/Oka.jpg',
}

export const routeShowcaseImages = [
  ...namedRouteImages.map((route) => route.image),
  ...Object.values(fallbackRouteImages),
].filter((image, index, images) => images.indexOf(image) === index)

const normalizeRouteText = (value: string) => value.toLowerCase().replaceAll('ё', 'е').trim()

export function getRouteImage(title: string, _description: string, accessType: RouteAccessType) {
  const normalizedTitle = normalizeRouteText(title)
  const matchedRoute = namedRouteImages.find((route) => route.title === normalizedTitle)

  return matchedRoute?.image ?? fallbackRouteImages[accessType]
}
