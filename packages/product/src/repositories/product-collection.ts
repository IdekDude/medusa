import { Product, ProductCollection } from "@models"
import {
  FilterQuery as MikroFilterQuery,
  FindOptions as MikroOptions,
  LoadStrategy,
} from "@mikro-orm/core"
import {
  Context,
  DAL,
  FindConfig,
  ProductTypes,
} from "@medusajs/types"
import { SqlEntityManager } from "@mikro-orm/postgresql"
import {
  MedusaError,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/utils"

import { BaseRepository } from "./base"

export class ProductCollectionRepository extends BaseRepository {
  protected readonly manager_: SqlEntityManager

  constructor({ manager }: { manager: SqlEntityManager }) {
    // @ts-ignore
    super(...arguments)
    this.manager_ = manager
  }

  async find(
    findOptions: DAL.FindOptions<ProductCollection> = { where: {} },
    context: Context = {}
  ): Promise<ProductCollection[]> {
    const manager = (context.transactionManager ??
      this.manager_) as SqlEntityManager

    const findOptions_ = { ...findOptions }
    findOptions_.options ??= {}

    Object.assign(findOptions_.options, {
      strategy: LoadStrategy.SELECT_IN,
    })

    return await manager.find(
      ProductCollection,
      findOptions_.where as MikroFilterQuery<ProductCollection>,
      findOptions_.options as MikroOptions<ProductCollection>
    )
  }

  async findAndCount(
    findOptions: DAL.FindOptions<ProductCollection> = { where: {} },
    context: Context = {}
  ): Promise<[ProductCollection[], number]> {
    const manager = (context.transactionManager ??
      this.manager_) as SqlEntityManager

    const findOptions_ = { ...findOptions }
    findOptions_.options ??= {}

    Object.assign(findOptions_.options, {
      strategy: LoadStrategy.SELECT_IN,
    })

    return await manager.findAndCount(
      ProductCollection,
      findOptions_.where as MikroFilterQuery<ProductCollection>,
      findOptions_.options as MikroOptions<ProductCollection>
    )
  }

  @InjectTransactionManager()
  async delete(
    collectionIds: string[],
    @MedusaContext()
    { transactionManager: manager }: Context = {}
  ): Promise<void> {
    await (manager as SqlEntityManager).nativeDelete(
      ProductCollection,
      { id: { $in: collectionIds } },
      {}
    )
  }

  @InjectTransactionManager()
  async create(
    data: ProductTypes.CreateProductCollectionDTO[],
    @MedusaContext()
    context: Context = {}
  ): Promise<ProductCollection[]> {
    const manager = this.getActiveManager(context)

    const productCollections = data.map((typeData) => {
      return manager.create(ProductCollection, typeData)
    })

    await manager.persist(productCollections)

    return productCollections
  }

  @InjectTransactionManager()
  async update(
    data: ProductTypes.UpdateProductCollectionDTO[],
    @MedusaContext()
    context: Context = {}
  ): Promise<ProductCollection[]> {
    const manager = this.getActiveManager(context)
    const collectionIds = data.map((collectionData) => collectionData.id)
    const existingTypes = await this.find(
      {
        where: {
          id: {
            $in: collectionIds,
          },
        },
      },
      context
    )

    const existingTypesMap = new Map(
      existingTypes.map<[string, ProductCollection]>((collection) => [collection.id, collection])
    )

    const productCollections = data.map((collectionData) => {
      const existingType = existingTypesMap.get(collectionData.id)

      if (!existingType) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `ProductCollection with id "${collectionData.id}" not found`
        )
      }

      return manager.assign(existingType, collectionData)
    })

    await manager.persist(productCollections)

    return productCollections
  }
}
