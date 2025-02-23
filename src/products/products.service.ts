import { HttpStatus, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { PrismaClient } from "@prisma/client";
import { PaginationDto } from "../common/dtos";
import { RpcException } from "@nestjs/microservices";

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger("ProductsService");

  onModuleInit() {
    this.$connect();
    this.logger.log("DB connected");
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    const count = await this.product.count({ where: { available: true } });

    const totalPages = Math.ceil(count / limit);

    return {
      data: await this.product.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where: { available: true },
      }),
      meta: {
        count,
        totalPages,
        page,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({
      where: { id, available: true },
    });

    if (!product) {
      this.logger.error(`Product with id ${id} not found`);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Product with id ${id} not found`,
      });
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto;
    try {
      return await this.product.update({
        where: {
          id,
        },
        data,
      });
    } catch (error) {
      if (error.code === "P2025") {
        this.logger.error(`Product with id ${id} not found`);
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Product with id ${id} not found`,
        });
      }
      this.logger.error(`Error: `, error.message);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  async remove(id: number) {
    try {
      return await this.product.update({
        where: { id },
        data: { available: false },
      });
    } catch (error) {
      if (error.code === "P2025") {
        this.logger.error(`Product with id ${id} not found`);
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Product with id ${id} not found`,
        });
      }

      this.logger.error(`Error: `, error.message);

      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  async validateProducts(ids: number[]) {
    ids = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    if (products.length !== ids.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: "Some products were not found",
      });
    }

    return products;
  }
}
