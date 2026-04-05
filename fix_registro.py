from pathlib import Path
path = Path(r"App movil/GestionSaludExpo/src/screens/RegistroScreen.tsx")
text = path.read_text(encoding='utf-8')
marker = "type Props = NativeStackScreenProps<RootStackParamList, 'Registro'>;\n\nexport function RegistroScreen"
replacement = "type Props = NativeStackScreenProps<RootStackParamList, 'Registro'>;\n\nconst templateKey = (user: string) => @fingerprint_template_;\n\nexport function RegistroScreen"
if marker not in text:
    raise SystemExit('marker not found')
text = text.replace(marker, replacement, 1)
old_block = "if (fingerprintTemplate) {\n        await AsyncStorage.setItem('@fingerprint_template_', fingerprintTemplate);\n      }\n      Alert.alert('Cuenta creada', 'Ya puedes iniciar sesión.', [\n        { text: 'Ir al login', onPress: () => navigation.replace('Login') },\n      ]);"
new_block = "if (fingerprintTemplate) {\n        try:\n          await AsyncStorage.setItem(templateKey(username), fingerprintTemplate)\n        except Exception as storage_error:\n          print('no se pudo guardar la huella localmente', storage_error)\n      }\n      Alert.alert('Registro exitoso', body?.message ?? 'Ya puedes iniciar sesión.', [\n        { text: 'Ir al login', onPress: () => navigation.replace('Login') },\n      ]);"
text = text.replace(old_block, new_block, 1)
path.write_text(text, encoding='utf-8')
