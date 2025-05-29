// src/components/AnalyzerScope.tsx

import React, { Component } from 'react';
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { Accordion, AccordionBody, AccordionHeader, AccordionItem } from "reactstrap";
import ProjectService from '../../Application/Project/ProjectService';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

interface Props {
  projectService: ProjectService;
  show: boolean;
  onHide: () => void;
}

interface State {
  allScopeConfigurations: any[];
  openKeys: string[];
}

export default class AnalyzerScope extends Component<Props, State> {
  state: State = {
    allScopeConfigurations: [],
    openKeys: []
  };

  componentDidMount() {
    this.loadConfigurations();
  }

  componentDidUpdate(prev: Props) {
    if (this.props.show && !prev.show) {
      this.loadConfigurations();
    }
  }

  loadConfigurations() {
    const selectedScope = this.props.projectService.getSelectedScope();
    if (!selectedScope) return;
    this.props.projectService.getAllConfigurations(
      (configs: any[]) => this.setState({ allScopeConfigurations: configs }),
      (err: any) => console.error('Error loading configs', err)
    );
  }

  toggleKey = (key: string) => {
    this.setState(({ openKeys }) => ({
      openKeys: openKeys.includes(key)
        ? openKeys.filter(k => k !== key)
        : [...openKeys, key]
    }));
  };

  // --- Funciones de análisis ---
  getMaterialsFromConfig(config: any): any[] {
    const all: any[] = [];
    (function trav(features: any[]) {
      features.forEach(f => {
        const q = f.properties?.find((p: any) => p.name==='Quantity')?.value;
        if (q != null && Number(q) >= 1) all.push(f);
        if (f.children) trav(f.children);
      });
    })(config.features || []);
    return all;
  }

  getBoMLevel(material: any): number {
    const bomProp = material.properties?.find((p: any) => p.name === "BoM_level");
    if (bomProp && bomProp.value) {
      const match = bomProp.value.match(/level\s*(\d+)/i);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    return 99;
  }

  getBoMLabel(mat: any): string {
    // Buscar la propiedad BoM_level
    const bomProp = mat.properties?.find((p: any) => p.name === "BoM_level");
    if (!bomProp || !bomProp.value) {
      return "component/sub-assemblie";
    }
    // Extraer la parte textual antes del "(level X)" si existe
    // por ejemplo, "Component (level 1)" => "component"
    const value = bomProp.value.toLowerCase(); // "component (level 1)"
    let label = value.split("(level")[0]?.trim();
    // si no se puede extraer, default
    if (!label) label = "component/sub-assemblie";
    return label;
  }

  renderMaterialsGrouped(materials: any[]) {
    const groups: Record<number, any[]> = {};
    materials.forEach(m => {
      const l = this.getBoMLevel(m);
      (groups[l] = groups[l]||[]).push(m);
    });
    return Object.keys(groups)
      .map(Number)
      .sort((a,b)=>a-b)
      .map(l => (
        <div key={l} style={{marginBottom:10}}>
          <strong>{{0:'Product',1:'Components',2:'Sub-assemblies'}[l]||`Level ${l}`}</strong>
          <ul style={{listStyle:'none', paddingLeft:15}}>
            {groups[l].map((m,i)=><li key={i}>{m.name}</li>)}
          </ul>
        </div>
      ));
  }

  renderMaterialDependenciesPartition() {
  // Obtenemos todas las dependencias según la lógica (por ejemplo, con threshold 1.0)
  const deps = this.getPartialDependencies(1.0);

  // Particionamos en bidireccionales y unidireccionales
  const bidirectional = deps.filter(dep => dep.aImpliesB && dep.bImpliesA);
  const unidirectional = deps.filter(dep => (dep.aImpliesB && !dep.bImpliesA) || (!dep.aImpliesB && dep.bImpliesA));

  return (
    <div>
      <h5>Potential component dependencies</h5>
      {/* Texto introductorio */}
      <p style={{ fontStyle: "italic", color: "#666", marginBottom: "10px" }}>
      The following dependencies indicate that one material requires another to function properly. Symbols: “⇔” for both ways, “⇒” or “⇐” for one-way.</p>

      <p style={{ fontStyle: "italic", color: "#666", marginBottom: "10px" }}>
      These dependencies exclude any pairs where at least one component is core or already linked through structural relationships. 
      Also, each dependency only appears if the source material appears in multiple configurations and always (or above a threshold) co-occurs with the target, ensuring meaningful associations.
      </p>

      {/* Sección de Dependencias Bidireccionales */}
      <h6>Bidirectional Dependencies (Always appear together under threshold)</h6>
      {bidirectional.length === 0 ? (
        <p>No bidirectional dependencies found.</p>
      ) : (
        this.renderPartialDependenciesTable(bidirectional)
      )}

      {/* Sección de Dependencias Unidireccionales */}
      <h6>Unidirectional Dependencies</h6>
      {unidirectional.length === 0 ? (
        <p>No unidirectional dependencies found.</p>
      ) : (
        this.renderPartialDependenciesTable(unidirectional)
      )}
    </div>
  );
}
renderPartialDependenciesTable(deps: any[]) {
  if (!deps || deps.length === 0) {
    return <p>No dependencies found.</p>;
  }

  const getLabel = (mat: any) => this.getBoMLabel(mat);

  return (
    <table
      style={{
        borderCollapse: "collapse",
        width: "100%",
        marginTop: "10px",
      }}
    >
      <thead>
        <tr style={{ backgroundColor: "#f8f8f8", border: "1px solid #ccc" }}>
          <th
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              fontWeight: "bold",
              textAlign: "left",
            }}
          >
            Material Dependencies (Threshold-based)
          </th>
        </tr>
      </thead>
      <tbody>
        {deps.map((pair: any, idx: number) => {
          const labelA = getLabel(pair.matA);
          const labelB = getLabel(pair.matB);
          if (pair.aImpliesB && pair.bImpliesA) {
            return (
              <tr key={idx} style={{ border: "1px solid #ccc" }}>
                <td style={{ padding: "8px" }}>
                  {`${labelA} "${pair.matA.name}" ⇔ ${labelB} "${pair.matB.name}" (always appear together under threshold)`}
                </td>
              </tr>
            );
          } else if (pair.aImpliesB) {
            return (
              <tr key={idx} style={{ border: "1px solid #ccc" }}>
                <td style={{ padding: "8px" }}>
                  {`If ${labelA} "${pair.matA.name}" is selected ⇒ ${labelB} "${pair.matB.name}" must also be selected.`}
                </td>
              </tr>
            );
          } else if (pair.bImpliesA) {
            return (
              <tr key={idx} style={{ border: "1px solid #ccc" }}>
                <td style={{ padding: "8px" }}>
                  {`If ${labelB} "${pair.matB.name}" is selected ⇒ ${labelA} "${pair.matA.name}" must also be selected.`}
                </td>
                </tr>
            );
          }
          return null;
        })}
      </tbody>
    </table>
  );
}
  getRequirementsReport() {
    const cfgs = this.state.allScopeConfigurations, total=cfgs.length;
    const stats: Record<string, any> = {};
    cfgs.forEach(c => {
      const seen = new Set<string>();
      this.getMaterialsFromConfig(c).forEach(m => {
        seen.add(m.id);
        stats[m.id] = stats[m.id]||{id:m.id,name:m.name,count:0};
      });
      seen.forEach(id => stats[id].count++);
    });
    const req=[], rec=[], opt=[];
    Object.values(stats).forEach((s: any) => {
      if (s.count===total) req.push(s);
      else if (s.count>= total*0.5) rec.push(s);
      else opt.push(s);
    });
    return { required:req, recommended:rec, optional:opt, total };
  }

  getPartialExclusions(th=1.0, minOcc=2) {
    const cfgs = this.state.allScopeConfigurations; if (!cfgs.length) return [];
    const map = new Map<string, any>(), appear=new Map(), cooc=new Map();
    cfgs.forEach(c => {
      const mats = this.getMaterialsFromConfig(c).filter(m=>!this.getBoMLabel(m).includes('product'));
      const uniq = Array.from(new Set(mats.map(m=>m.id)));
      uniq.forEach(id => appear.set(id,(appear.get(id)||0)+1));
      uniq.forEach((a,i)=> uniq.slice(i+1).forEach(b=>{
        cooc.set(`${a},${b}`,(cooc.get(`${a},${b}`)||0)+1);
        cooc.set(`${b},${a}`,(cooc.get(`${b},${a}`)||0)+1);
      }));
      mats.forEach(m=>map.set(m.id,m));
    });
    const core = new Set(Array.from(appear).filter(([_,c])=>c===cfgs.length).map(([id])=>id));
    const res=[];
    Array.from(map.values()).forEach((A: any,i,arr) =>
      arr.slice(i+1).forEach((B:any)=>{
        if (core.has(A.id)||core.has(B.id)) return;
        const a=appear.get(A.id)||0,b=appear.get(B.id)||0,co=cooc.get(`${A.id},${B.id}`)||0;
        const rA=(a-co)/a, rB=(b-co)/b, exA=rA>=th&&a>=minOcc, exB=rB>=th&&b>=minOcc;
        if (exA||exB) res.push({A,B,exA,exB});
      })
    );
    return res;
  }

  renderExclusions() {
    const ex = this.getPartialExclusions();
    if (!ex.length) return <p>No exclusions found.</p>;
    return (
      <table style={{width:'100%',borderCollapse:'collapse'}}><tbody>
        {ex.map((e,i)=>(
          <tr key={i} style={{border:'1px solid #ccc'}}>
            <td style={{padding:8}}>
              {e.exA && <>{`If ${this.getBoMLabel(e.A)} "${e.A.name}" ⇒ not ${this.getBoMLabel(e.B)} "${e.B.name}".`}</>}
              {e.exB && <>{`If ${this.getBoMLabel(e.B)} "${e.B.name}" ⇒ not ${this.getBoMLabel(e.A)} "${e.A.name}".`}</>}
            </td>
          </tr>
        ))}
      </tbody></table>
    );
  }

  getPartialDependencies(th=1.0, minOcc=2) {
    // ... similar a getPartialExclusions, pero ratio co-ocurrencia ...
    return []; // implementación análoga
  }

  calculateAverageAdvancedRatio(): number {
    const cfgs=this.state.allScopeConfigurations, core=new Set<string>(
      Object.keys(this.getRequirementsReport().required || {})
    );
    let sum=0,count=0;
    cfgs.forEach(c=>{
      const mats=this.getMaterialsFromConfig(c);
      if (!mats.length) return;
      const adv=mats.filter(m=>!core.has(m.id)).length;
      sum+=adv/mats.length; count++;
    });
    return count?sum/count:0;
  }

  analyzeScopeMetrics(): string[] {
    const msgs:string[]=[], avg=this.calculateAverageAdvancedRatio();
    const TC = ['Low','Low','Low','Medium','High'][Math.round(1+4*avg)] || 'Low';
    const MI = Math.round(100*avg), risk= avg>0.7?'High':avg>0.3?'Medium':'Low';
    const scope = this.props.projectService.getScope();
    if(!scope){
      return null;
    }
    const expTC=scope.technicalComplexity || 'Low';
    const expMI=scope.marketImpact||0;
    const expR=scope.risk||'Medium';
    msgs.push(`Technical Complexity: Expected ≈ ${expTC}, Found ${TC}.`);
    msgs.push(`Market Impact: Expected ≈ ${expMI}, Found ${MI}.`);
    msgs.push(`Risk: Expected "${expR}", Found "${risk}".`);
    if (expTC!==TC) msgs.push('Warning: TC discrepancy.');
    if (Math.abs(expMI-MI)>=20) msgs.push('Warning: MI discrepancy.');
    if (expR!==risk) msgs.push('Warning: Risk discrepancy.');
    return msgs;
  }

  renderScopeMetricsAnalysis() {
    if(!this.analyzeScopeMetrics()){
      return null;
    }
    const lines=this.analyzeScopeMetrics(), main=lines.filter(l=>!l.startsWith('Warning')), warn=lines.filter(l=>l.startsWith('Warning'));
    return (
      <div>
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:10}}>
          <thead><tr style={{background:'#f2f2f2'}}><th>Metric</th><th>Expected</th><th>Found</th><th>Status</th></tr></thead>
          <tbody>
            {main.map((l,i)=>{
              const [m,e,f]=l.match(/Expected.*?([\w\d]+).*?Found.*?([\w\d]+)/i)!.slice(1);
              return (
                <tr key={i}>
                  <td style={{border:'1px solid #ddd',padding:6}}>{l.split(':')[0]}</td>
                  <td style={{border:'1px solid #ddd',padding:6,textAlign:'center'}}>{e}</td>
                  <td style={{border:'1px solid #ddd',padding:6,textAlign:'center'}}>{f}</td>
                  <td style={{border:'1px solid #ddd',padding:6}}>{e===f? <FaCheckCircle color="green"/>:<FaExclamationTriangle color="red"/>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {warn.length>0 && <ul style={{color:'red'}}>{warn.map((w,i)=><li key={i}>{w.replace('Warning: ','')}</li>)}</ul>}
      </div>
    );
  }

  renderPerProductMetrics() {
    // ... análogo al renderScopeMetricsAnalysis, iterando configs individuales ...
    return null;
  }
  // -----------------------------------

  render() {
    const rpt = this.getRequirementsReport();
    return (
      <Modal show={this.props.show} onHide={this.props.onHide} size="xl" dialogClassName="modal-xxl">
        <Modal.Header closeButton><Modal.Title>Scope Analysis</Modal.Title></Modal.Header>
        <Modal.Body style={{maxHeight:'80vh',overflowY:'auto'}}>
          <Accordion flush open={this.state.openKeys} toggle={this.toggleKey}>
            <AccordionItem>
              <AccordionHeader  targetId="componentPrioritization">Component Prioritization</AccordionHeader>
              <AccordionBody accordionId="componentPrioritization">
                {this.renderMaterialsGrouped(rpt.required)}
                {this.renderMaterialsGrouped(rpt.recommended)}
                {this.renderMaterialsGrouped(rpt.optional)}
              </AccordionBody>
            </AccordionItem>

            <AccordionItem>
              <AccordionHeader targetId="modelConstraints">Potential Exclusions</AccordionHeader>
              <AccordionBody  accordionId="modelConstraints">{this.renderExclusions()}</AccordionBody>
            </AccordionItem>

            <AccordionItem>
              <AccordionHeader targetId="modelDependencies">Potential Dependencies</AccordionHeader>
              <AccordionBody accordionId="modelDependencies">
                {/* sustituye con tu renderPartialDependenciesTable */}
                {this.renderMaterialDependenciesPartition()}
              </AccordionBody>
            </AccordionItem>

            <AccordionItem>
              <AccordionHeader targetId="scopeMetrics">Scope Metrics Analysis</AccordionHeader>
              <AccordionBody accordionId="scopeMetrics">{this.renderScopeMetricsAnalysis()}</AccordionBody>
            </AccordionItem>

            {/* Puedes añadir también <AccordionItem> per-product metrics y demás */}
          </Accordion>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
