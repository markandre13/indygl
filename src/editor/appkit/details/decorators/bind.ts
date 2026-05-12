// vite's rolldown does not support tc39 decorators yet...
// maybe compile with tsgo and then use vite on the resulting js?
export function bind(_target: any, context: ClassMemberDecoratorContext) {
    const methodName = context.name
    if (context.private) {
        throw Error(`@bind cannot decorate private properties like ${methodName.toString()}`)
    }
    context.addInitializer(function () {
        (this as any)[methodName] = (this as any)[methodName].bind(this)
    })
}
