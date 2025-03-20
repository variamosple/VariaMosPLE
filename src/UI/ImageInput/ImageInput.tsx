import React, { Component, ChangeEvent, DragEvent } from "react";

interface Props {
  className?: string; // Imagen actual en base64 o undefined
  value?: string; // Imagen actual en base64 o undefined
  onChange?: (e: any) => void; // Evento para manejar cambios en la imagen
}

export default class ImageInput extends Component<Props> {
  private fileInput: HTMLInputElement | null = null;
  private value: any;

  constructor(props: Props) {
    super(props);
    this.value=this.props.value;
    this.handleDrop = this.handleDrop.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this);
  }

  // Evita que el navegador abra la imagen al arrastrarla
  handleDragOver(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
  }

  // Maneja el evento de soltar una imagen
  async handleDrop(event: DragEvent<HTMLDivElement>): Promise<void> {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const base64 = await this.convertToBase64(file);
      if (this.props.onChange) {
        this.value=base64;
        this.props.onChange({
          target: this
        });
      }
    }
  }

  // Convierte un archivo en base64
  private convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Maneja el cambio cuando se selecciona una imagen desde un input
  async handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const base64 = await this.convertToBase64(file);
      if (this.props.onChange) {
        this.value=base64;
        this.props.onChange({
          target: this
        });
      }
    }
  }

  render() {
    const { value } = this.props;
    let message="Click here to select a image."; //"Drag an image here or click to select it.";
    let elementMessage=null;
    let elementImage=null;
    if (!this.props.value || this.props.value=='Undefined') {
      elementMessage=(<p style={{ marginTop: "10px", cursor: "pointer" }} onClick={() => this.fileInput?.click()}>{message}</p>);
    }else{
      elementImage=(
        <img
          src={value || "https://via.placeholder.com/150"} 
          title={message}
          style={{
            cursor: "pointer",
          }}
          onClick={() => this.fileInput?.click()}
        />
      );
    }

    return (
      <div className={this.props.className}
        style={{
          textAlign: "center",
          position: "relative",
        }}
        onDragOver={this.handleDragOver}
        onDrop={this.handleDrop}
      >
        {elementImage}
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          ref={(input) => (this.fileInput = input)}
          onChange={this.handleFileChange}
        />
        {elementMessage}
      </div>
    );
  }
} 
