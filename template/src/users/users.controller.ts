import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from 'src/auth/dto/createUser.dto';
import { Public } from 'src/auth/public.guard';
import { UserEntity } from './user.entity';
import { DeleteUserDTO } from 'src/auth/dto/deleteUser.dto';
import Stripe from 'stripe';
import RowtConfig from 'src/rowtconfig';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('byEmail')
  getProfile(@Body() user: { email: UserEntity['email'] }) {
    try {
      const foundUser = this.usersService.findByEmail(user.email);
      return foundUser;
    } catch (error) {
      return error;
    }
  }
  @Post('byId')
  getProfileById(@Body() user: { id: UserEntity['id'] }) {
    try {
      const foundUser = this.usersService.findByEmail(String(user.id));
      return foundUser;
    } catch (error) {
      return error;
    }
  }

  @Get('currentUser')
  getSignedInProfile(@Request() req) {
    try {
      const user = this.usersService.findById(req.user.id);
      if (!user) {
        console.log(`user not found by id ${req.user.id}`);
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      return error.message;
    }
  }

  @Public()
  @Post('create')
  @HttpCode(201)
  async createUser(@Body() createUserDto: CreateUserDTO) {
    return await this.usersService.createUser(createUserDto);
  }

  @Post('delete')
  @HttpCode(200)
  deleteUser(@Request() req, @Body() deleteUserDto: DeleteUserDTO) {
    try {
      if (req.user.email !== deleteUserDto.email && req.user.role !== 'admin') {
        throw new Error('User not authorized to delete this user');
      }
      this.usersService.deleteUser(req.user.email);
      return `User with email ${req.user.email} deleted`;
    } catch (error) {
      return error;
    }
  }

  @Post('usage')
  async getUserUsage(@Body() body: { userId: number }) {
    try {
      const user = await this.usersService.findById(body.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const usage = await this.usersService.getUserUsage(body.userId);
      return usage;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('tier')
  async getUserTier(@Body() body: { userId: number }) {
    try {
      const user = await this.usersService.findById(body.userId);

      const defaultResponse = {
        tier: 0,
        allowances: {
          links: RowtConfig.tierLimits.links[0] || 10,
          interactions: RowtConfig.tierLimits.interactions[0] || 1000,
        },
      };

      if (!user || !user.customerId) {
        return defaultResponse;
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
      const customer = await stripe.customers.retrieve(user.customerId, {
        expand: ['subscriptions'],
      });

      if ('deleted' in customer && customer.deleted) {
        return defaultResponse;
      }

      const subscription = customer.subscriptions?.data[0];
      if (!subscription) {
        return defaultResponse;
      }

      // Get the product ID from the plan
      const productId = subscription.items.data[0].plan.product;

      // Fetch the product separately to get its metadata
      const product = await stripe.products.retrieve(productId as string);
      const tier = product.metadata?.tier ? parseInt(product.metadata.tier) : 0;

      const allowances = {
        links:
          RowtConfig.tierLimits.links[tier] || RowtConfig.tierLimits.links[0],
        interactions:
          RowtConfig.tierLimits.interactions[tier] ||
          RowtConfig.tierLimits.interactions[0],
      };

      return { tier, allowances };
    } catch (error) {
      console.error('Error fetching user tier:', error);
      return {
        tier: 0,
        allowances: {
          links: RowtConfig.tierLimits.links[0] || 10,
          interactions: RowtConfig.tierLimits.interactions[0] || 1000,
        },
      };
    }
  }
}
