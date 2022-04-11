export type Variable = {
  replacer: string;
  value: any;
};

export const replaceTemplate = (template: string, variables: Variable[]) => {
  let newTemplate = template;

  variables.forEach((variable) => {
    const newRegex = new RegExp(variable.replacer, 'g');

    newTemplate = newTemplate.replace(newRegex, variable.value);
  });

  return newTemplate;
};
