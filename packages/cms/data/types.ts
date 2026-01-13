export interface Artwork {
  id: string
  filename: string
  title: {
    cs: string
    en: string
  }
  medium: {
    cs: string
    en: string
  }
  dimensions: string
  year: number
  status?: 'sold' | 'donated'
}

export interface PaintingYear {
  year: number
  artworks: Artwork[]
}

export interface WatercolorSeries {
  id: string
  title: {
    cs: string
    en: string
  }
  year: number
  preview: string[]
  artworks: Artwork[]
}

export interface CarouselSlide {
  filename: string
  alt: {
    cs: string
    en: string
  }
}
