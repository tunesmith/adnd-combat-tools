import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

function walkFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function createTypeScriptProgram(): ts.Program {
  const configPath = join(process.cwd(), 'tsconfig.json');
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n')
    );
  }
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    process.cwd()
  );
  return ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
  });
}

function flattenTypes(type: ts.Type): ts.Type[] {
  const nestedTypes = (type as ts.UnionOrIntersectionType).types;
  if (Array.isArray(nestedTypes) && nestedTypes.length > 0) {
    return nestedTypes.flatMap(flattenTypes);
  }
  return [type];
}

function readPropertyTypeText(
  checker: ts.TypeChecker,
  property: ts.Symbol,
  fallbackNode: ts.Node
): string {
  const declaration =
    property.valueDeclaration ?? property.declarations?.[0] ?? fallbackNode;
  return checker.typeToString(
    checker.getTypeOfSymbolAtLocation(property, declaration)
  );
}

function isPendingRollLikeType(
  checker: ts.TypeChecker,
  type: ts.Type,
  fallbackNode: ts.Node
): boolean {
  return flattenTypes(type).some((candidate) => {
    const typeProperty = candidate.getProperty('type');
    const tableProperty = candidate.getProperty('table');
    if (!typeProperty || !tableProperty) {
      return false;
    }
    return (
      readPropertyTypeText(checker, typeProperty, fallbackNode) ===
      '"pending-roll"'
    );
  });
}

describe('dungeon architecture guardrails', () => {
  const dungeonRoot = join(process.cwd(), 'src/dungeon');

  test('keeps React out of the pure dungeon layer', () => {
    const offenders = walkFiles(dungeonRoot).filter((filePath) => {
      if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
        return false;
      }
      const source = readFileSync(filePath, 'utf8');
      return /from ['"]react(?:\/.*)?['"]/.test(source);
    });

    expect(offenders).toEqual([]);
  });

  test('centralizes scoped table-id parsing in the pending roll helper', () => {
    const offenders = walkFiles(dungeonRoot).filter((filePath) => {
      if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
        return false;
      }
      if (filePath.endsWith('src/dungeon/domain/pendingRoll.ts')) {
        return false;
      }
      const source = readFileSync(filePath, 'utf8');
      return source.includes("split(':')");
    });

    expect(offenders).toEqual([]);
  });

  test('centralizes legacy pending-roll field access in the pending roll helper', () => {
    const program = createTypeScriptProgram();
    const checker = program.getTypeChecker();
    const offenders: string[] = [];

    for (const sourceFile of program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) continue;
      const filePath = sourceFile.fileName.replace(/\\/g, '/');
      if (!filePath.includes('/src/dungeon/')) continue;
      if (filePath.endsWith('/src/dungeon/domain/pendingRoll.ts')) continue;
      if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) continue;

      const visit = (node: ts.Node): void => {
        if (
          ts.isPropertyAccessExpression(node) &&
          (node.name.text === 'table' || node.name.text === 'context')
        ) {
          const targetType = checker.getTypeAtLocation(node.expression);
          if (isPendingRollLikeType(checker, targetType, node.expression)) {
            const { line, character } =
              sourceFile.getLineAndCharacterOfPosition(node.name.getStart());
            offenders.push(
              `${filePath}:${line + 1}:${character + 1} ${node.getText(
                sourceFile
              )}`
            );
          }
        }
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    expect(offenders).toEqual([]);
  });

  test('keeps room and chamber special-casing out of outcomeTree', () => {
    const source = readFileSync(
      join(dungeonRoot, 'helpers/outcomeTree.ts'),
      'utf8'
    );

    expect(source).not.toContain('roomDimensions');
    expect(source).not.toContain('chamberDimensions');
    expect(source).not.toContain('unusualSize');
    expect(source).not.toContain('numberOfExits');
  });
});
