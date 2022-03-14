export class MyComponent {
  public name: string;

  constructor(name: string) {
    this.name = name;
    console.log(`Hi, my name is ${this.name}`);
  }
}