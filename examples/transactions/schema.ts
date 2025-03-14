import { gWithContext, list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import { text, integer, relationship, timestamp, virtual } from '@keystone-6/core/fields'
import type { Lists, Context } from '.keystone/types'

const g = gWithContext<Context>()
type g<T> = gWithContext.infer<T>

export const extendGraphqlSchema = g.extend(base => {
  return {
    mutation: {
      submitOrder: g.field({
        type: base.object('Order'),
        args: {},
        async resolve(source, {}, context) {
          // TODO: this should come from GraphQL arguments
          const orderInput = [
            { sku: '123', count: 1 },
            { sku: '124', count: 5 },
            { sku: '125', count: 2 },
          ]

          return await context.transaction(async tx => {
            const assigned = []

            for (const { sku, count } of orderInput) {
              const items = await tx.db.Item.findMany({
                take: count,
                where: {
                  product: {
                    sku: {
                      equals: sku,
                    },
                  },
                  assignment: null,
                },
              })

              if (items.length !== count) throw new Error('Could not complete order')
              assigned.push(...items)
            }

            const order = await tx.db.Order.createOne({
              data: {
                items: {
                  connect: assigned.map(i => ({ id: i.id })),
                },
              },
            })

            return order
          })
        },
      }),
    },
  }
})

export const lists = {
  Order: list<Lists.Order.TypeInfo>({
    access: allowAll,
    fields: {
      items: relationship({ ref: 'Item.assignment', many: true }),
      createdAt: timestamp(),
    },
  }),

  Item: list<Lists.Item.TypeInfo>({
    access: allowAll,
    fields: {
      product: relationship({ ref: 'Product', many: false }),
      serialNumber: text(),

      assignment: relationship({ ref: 'Order.items', many: false }),
      addedAt: timestamp({ defaultValue: { kind: 'now' } }),
    },
  }),

  Product: list<Lists.Product.TypeInfo>({
    access: allowAll,
    fields: {
      sku: text(),
      description: text(),
      value: integer(),

      available: virtual({
        field: g.field({
          type: g.Int,
          resolve(item, args, context) {
            return context.db.Item.count({
              where: {
                product: {
                  id: {
                    equals: item.id,
                  },
                },
                assignment: null,
              },
            })
          },
        }),
      }),
    },
    ui: {
      labelField: 'description',
    },
  }),
}
