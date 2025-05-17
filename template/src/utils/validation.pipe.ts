import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

/**
 * Enhanced validation pipe that provides detailed validation error messages
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  constructor(
    private readonly options?: {
      whitelist?: boolean;
      forbidNonWhitelisted?: boolean;
      transform?: boolean;
      skipMissingProperties?: boolean;
    },
  ) {
    this.options = options || {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: false,
    };
  }

  /**
   * Transform and validate incoming data against DTO
   */
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object, {
      whitelist: this.options?.whitelist,
      forbidNonWhitelisted: this.options?.forbidNonWhitelisted,
      skipMissingProperties: this.options?.skipMissingProperties,
    });

    if (errors.length > 0) {
      // Extract and format validation errors
      const formattedErrors = errors.map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints)
          : ['Invalid value'];
        return {
          property: err.property,
          errors: constraints,
          value: err.value,
        };
      });

      // Provide detailed error response
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    return this.options?.transform ? object : value;
  }

  /**
   * Check if the metatype needs validation
   */
  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
