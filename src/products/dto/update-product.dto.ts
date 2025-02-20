import { PartialType } from "@nestjs/mapped-types";
import { CreateProductDto } from "./create-product.dto";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
} from "class-validator";

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsNumber()
  @IsPositive()
  id: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ValidateIf((o) => !o.name && !o.price && !o.description)
  @IsString({ message: "At least one field must be provided" })
  dummyField?: string;
}
