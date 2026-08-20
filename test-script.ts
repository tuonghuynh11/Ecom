type Variant = {
  value: string
  options: string[]
}

type SKU = {
  value: string
  price: number
  stock: number
  image: string
}

type Data = {
  product: {
    publishedAt: string | null // ISO date string
    name: string
    basePrice: number
    virtualPrice: number
    brandId: number
    images: string[]
    categories: number[]
  }
  skus: SKU[]
}

// My Function to generate all possible SKU combinations from variants
function generateSKU(variants: Variant[]): SKU[] {
  let skus: string[] = ['']
  for (const variant of variants) {
    const newSkus: string[] = []
    for (const option of variant.options) {
      for (const sku of skus) {
        newSkus.push(sku ? `${sku}-${option}` : option)
      }
    }
    skus = newSkus
  }

  return skus.map((sku: string) => ({
    value: sku,
    price: 0,
    stock: 0,
    image: '',
  }))
}

// Another approach to generate all possible SKU combinations from variants
function generateSKUs(variants: Variant[]): SKU[] {
  // Hàm hỗ trợ để tạo tất cả tổ hợp
  function getCombinations(arrays: string[][]): string[] {
    return arrays.reduce((acc, curr) => acc.flatMap((x) => curr.map((y) => `${x}${x ? '-' : ''}${y}`)), [''])
  }

  // Lấy mảng các options từ variants
  const options = variants.map((variant) => variant.options)

  // Tạo tất cả tổ hợp
  const combinations = getCombinations(options)

  // Chuyển tổ hợp thành SKU objects
  return combinations.map((value) => ({
    value,
    price: 0,
    stock: 100,
    image: '',
  }))
}

const testData: Variant[] = [
  {
    value: 'Màu sắc',
    options: ['Đen', 'Trắng', 'Xanh'],
  },
  {
    value: 'Kích thước',
    options: ['S', 'M', 'L'],
  },
  {
    value: 'Chất liệu',
    options: ['Cotton', 'Polyester'],
  },
]

const result = generateSKU(testData)

console.log(result)
console.log('Passed Test: ', result.length === 18) //
