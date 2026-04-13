import { registerDecorator, ValidationOptions } from 'class-validator';

const DB_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function IsDbUuid(validationOptions?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isDbUuid',
      target: object.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && DB_UUID_REGEX.test(value);
        },
        defaultMessage() {
          return '$property must be a UUID-like identifier';
        },
      },
    });
  };
}
