import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { UserRepositoryPort } from './users.repository.port';
import { UserEntity } from './user.entity';
import { CreateUserDTO } from 'src/auth/dto/createUser.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import RowtConfig from 'src/rowtconfig';
import Stripe from 'stripe';

@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | undefined> {
    try {
      const userFound = await this.userRepository.findOne({
        where: { email: email },
      });
      if (!userFound) {
        throw new Error('User not found');
      }
      return userFound as UserEntity;
    } catch (error) {
      throw new Error('Unable to find user: ' + error);
    }
  }

  async findById(id: number): Promise<UserEntity | undefined> {
    try {
      const userFound = await this.userRepository.findOne({
        where: { id: id },
      });
      if (!userFound) {
        throw new Error('User not found');
      }
      return userFound as UserEntity;
    } catch (error) {
      throw new Error('Unable to find user: ' + error);
    }
  }

  async createUser(user: CreateUserDTO): Promise<UserEntity> {
    try {
      console.log('Creating user with email: ', user.email);
      if (!user.password) {
        throw new Error('Password is required');
      }
      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(user.password, saltOrRounds);

      let stripeCustomer;
      if (RowtConfig.stripe_integration) {
        // Create Stripe customer
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
        stripeCustomer = await stripe.customers.create({
          email: user.email,
        });
      }

      const userToCreate = this.userRepository.create({
        email: user.email,
        passwordHash: hashedPassword,
        emailVerified: false,
        role: 'user',
        customerId: stripeCustomer?.id,
      });
      const createdUser = await this.userRepository.save(userToCreate);
      return createdUser;
    } catch (error: any) {
      // Check if it's a duplicate key error
      if (error.code === '23505') {
        // PostgreSQL duplicate key error code
        throw new ConflictException('A user with this email already exists');
      }
      throw new BadRequestException('Unable to create user: ' + error.message);
    }
  }

  async updateUser(newUserDetails: UserEntity): Promise<UserEntity> {
    try {
      const updatedUser = await this.userRepository.save(newUserDetails);
      return updatedUser;
    } catch (error) {
      throw new Error('Unable to update user: ' + error);
    }
  }

  async deleteUser(email: string): Promise<UserEntity> {
    try {
      const userToDelete = await this.userRepository.findOne({
        where: { email: email },
      });
      if (!userToDelete) {
        throw new Error('User not found');
      }
      const deletedUser = await this.userRepository.remove(userToDelete);
      return deletedUser;
    } catch (error) {
      throw new Error('Unable to delete user: ' + error);
    }
  }

  async getUserUsage(id: number): Promise<{
    links: number;
    interactions: number;
    period: {
      start: Date;
      end: Date;
    };
  }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Default subscription period (30 days back to now)
      let periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 30);
      let periodEnd = new Date();

      // If Stripe is enabled and user has a customerId, get actual subscription period
      if (RowtConfig.stripe_integration && user.customerId) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
          const customer = await stripe.customers.retrieve(user.customerId, {
            expand: ['subscriptions'],
          });

          if (
            !('deleted' in customer) &&
            customer.subscriptions?.data.length &&
            customer.subscriptions?.data.length > 0
          ) {
            const subscription = customer.subscriptions.data[0];

            // Check if we have subscription items and get period dates
            if (
              subscription.items &&
              subscription.items.data &&
              subscription.items.data.length > 0 &&
              subscription.items.data[0].current_period_start &&
              subscription.items.data[0].current_period_end
            ) {
              periodStart = new Date(
                subscription.items.data[0].current_period_start * 1000,
              );
              periodEnd = new Date(
                subscription.items.data[0].current_period_end * 1000,
              );
            }
          }
        } catch (stripeErr) {
          console.error('Error fetching Stripe subscription:', stripeErr);
          // Continue with default period
        }
      }

      // Fixed SQL query:
      // 1. For links, only count those created within the period
      // 2. For interactions, count all interactions that happened within the period, regardless of when the link was created
      const result = await this.userRepository.query(
        `
        SELECT 
          COUNT(DISTINCT CASE WHEN l.created_at >= $2 AND l.created_at <= $3 THEN l.id ELSE NULL END) AS totalLinks,
          (
            SELECT COUNT(i.id) 
            FROM interactions i
            JOIN links l ON i.link_id = l.id
            JOIN projects p2 ON l.project_id = p2.id
            WHERE p2.user_id = $1
            AND i.timestamp >= $2 AND i.timestamp <= $3
          ) AS totalInteractions
        FROM projects p
        LEFT JOIN links l ON l.project_id = p.id
        WHERE p.user_id = $1
        `,
        [id, periodStart.toISOString(), periodEnd.toISOString()],
      );

      if (!result || result.length === 0) {
        return {
          links: 0,
          interactions: 0,
          period: {
            start: periodStart,
            end: periodEnd,
          },
        };
      }

      const { totallinks = '0', totalinteractions = '0' } = result[0];

      return {
        links: parseInt(totallinks, 10),
        interactions: parseInt(totalinteractions, 10),
        period: {
          start: periodStart,
          end: periodEnd,
        },
      };
    } catch (error) {
      throw new Error('Unable to get user usage: ' + error.message);
    }
  }
}
