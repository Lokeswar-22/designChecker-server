import { User } from '../entities/user.entity';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class RequestService {
  constructor(
    @Inject(REQUEST) private readonly request: Request & { user: User },
  ) { }

  getUser(): User {
    return this.request.user;
  }

  getBody(): any {
    return this.request.body;
  }

  getQueryParams(): any {
    return this.request.query;
  }

  getPathParam(): any {
    return this.request.params;
  }

  getHeader(): any {
    return { header: this.request.headers, ip: this.request.ip };
  }
}
