use std::rc::Rc;
use super::{Instr, Program, Value};

#[derive(Default)]
pub struct Vm;

impl Vm {
    pub fn execute(mut self, prog: &Program) -> Value {
        let mut expr_stack = Vec::<Value>::new();
        let mut call_stack = Vec::new();
        let mut local_stack = Vec::<Value>::new();

        let mut ip = prog.entry();

        loop {
            let instr = unsafe { prog.fetch_instr_unchecked(ip) };
            //println!("{:>#5X} => {:?}", ip, instr);

            ip += 1;

            match instr {
                Instr::Nop => {},

                Instr::Dup => expr_stack.push(expr_stack.last().unwrap().clone()),
                Instr::Pop => { expr_stack.pop().unwrap(); },

                Instr::Integer(x) => expr_stack.push(Value::Number(x as f64)),
                Instr::Float(x) => expr_stack.push(Value::Number(x as f64)),
                Instr::True => expr_stack.push(Value::Boolean(true)),
                Instr::False => expr_stack.push(Value::Boolean(false)),
                Instr::Char(c) => expr_stack.push(Value::Char(c)),

                Instr::MakeFunc(n, addr) => {
                    let mut env = (0..n).map(|_| expr_stack.pop().unwrap()).collect();
                    expr_stack.push(Value::Func(Rc::new((addr, env))));
                },
                Instr::ApplyFunc => {
                    let mut func = expr_stack.pop().unwrap().into_func_unchecked();
                    Rc::make_mut(&mut func).1
                        .drain(..)
                        .for_each(|env| local_stack.push(env));
                    call_stack.push(ip);
                    ip = func.0;
                },
                Instr::MakeList(n) => {
                    let list = Value::make_list((0..n).map(|_| expr_stack.pop().unwrap()));
                    expr_stack.push(list);
                },
                Instr::IndexList(x) => {
                    let item = expr_stack.pop().unwrap().index(x as usize);
                    expr_stack.push(item);
                },
                Instr::SetList(x) => {
                    let item = expr_stack.pop().unwrap();
                    expr_stack.last_mut().unwrap().as_list_unchecked_mut()[x as usize] = item;
                },
                Instr::TailList(x) => {
                    let list = std::mem::take(Rc::make_mut(&mut expr_stack.pop().unwrap().into_list_unchecked()));
                    expr_stack.push(Value::List(Rc::new(list.skip(x as usize))));
                },
                Instr::LenEqList(n) => {
                    let len = expr_stack.pop().unwrap().into_list_unchecked().len();
                    expr_stack.push(Value::Boolean(len == n as usize));
                },
                Instr::LenMoreEqList(n) => {
                    let len = expr_stack.pop().unwrap().into_list_unchecked().len();
                    expr_stack.push(Value::Boolean(len >= n as usize));
                },

                Instr::NegNum => {
                    let x = expr_stack.pop().unwrap().into_number_unchecked();
                    expr_stack.push(Value::Number(-x));
                },
                Instr::AddNum => {
                    let x = expr_stack.pop().unwrap().into_number_unchecked();
                    let y = expr_stack.pop().unwrap().into_number_unchecked();
                    expr_stack.push(Value::Number(x + y));
                },
                Instr::SubNum => {
                    let x = expr_stack.pop().unwrap().into_number_unchecked();
                    let y = expr_stack.pop().unwrap().into_number_unchecked();
                    expr_stack.push(Value::Number(x - y));
                },
                Instr::MulNum => {
                    let x = expr_stack.pop().unwrap().into_number_unchecked();
                    let y = expr_stack.pop().unwrap().into_number_unchecked();
                    expr_stack.push(Value::Number(x * y));
                },
                Instr::DivNum => {
                    let x = expr_stack.pop().unwrap().into_number_unchecked();
                    let y = expr_stack.pop().unwrap().into_number_unchecked();
                    expr_stack.push(Value::Number(x / y));
                },
                Instr::RemNum => {
                    let x = expr_stack.pop().unwrap().into_number_unchecked();
                    let y = expr_stack.pop().unwrap().into_number_unchecked();
                    expr_stack.push(Value::Number(x % y));
                },
                Instr::EqNum => {
                    let x = expr_stack.pop().unwrap().into_number_unchecked();
                    let y = expr_stack.pop().unwrap().into_number_unchecked();
                    expr_stack.push(Value::Boolean(x == y));
                },
                Instr::MoreNum => {
                    let x = expr_stack.pop().unwrap().into_number_unchecked();
                    let y = expr_stack.pop().unwrap().into_number_unchecked();
                    expr_stack.push(Value::Boolean(x > y));
                },
                Instr::LessNum => {
                    let x = expr_stack.pop().unwrap().into_number_unchecked();
                    let y = expr_stack.pop().unwrap().into_number_unchecked();
                    expr_stack.push(Value::Boolean(x < y));
                },
                Instr::MoreEqNum => {
                    let x = expr_stack.pop().unwrap().into_number_unchecked();
                    let y = expr_stack.pop().unwrap().into_number_unchecked();
                    expr_stack.push(Value::Boolean(x >= y));
                },
                Instr::LessEqNum => {
                    let x = expr_stack.pop().unwrap().into_number_unchecked();
                    let y = expr_stack.pop().unwrap().into_number_unchecked();
                    expr_stack.push(Value::Boolean(x <= y));
                },

                Instr::NotBool => {
                    let x = expr_stack.pop().unwrap().into_boolean_unchecked();
                    expr_stack.push(Value::Boolean(!x));
                },
                Instr::EqBool => {
                    let x = expr_stack.pop().unwrap().into_boolean_unchecked();
                    let y = expr_stack.pop().unwrap().into_boolean_unchecked();
                    expr_stack.push(Value::Boolean(x == y));
                },
                Instr::AndBool => {
                    let x = expr_stack.pop().unwrap().into_boolean_unchecked();
                    let y = expr_stack.pop().unwrap().into_boolean_unchecked();
                    expr_stack.push(Value::Boolean(x && y));
                },
                Instr::OrBool => {
                    let x = expr_stack.pop().unwrap().into_boolean_unchecked();
                    let y = expr_stack.pop().unwrap().into_boolean_unchecked();
                    expr_stack.push(Value::Boolean(x || y));
                },

                Instr::EqChar => {
                    let x = expr_stack.pop().unwrap().into_char_unchecked();
                    let y = expr_stack.pop().unwrap().into_char_unchecked();
                    expr_stack.push(Value::Boolean(x == y));
                },

                Instr::JoinList => {
                    let mut x = (*expr_stack.pop().unwrap().into_list_unchecked()).clone();
                    x.append((*expr_stack.pop().unwrap().into_list_unchecked()).clone());
                    expr_stack.push(Value::List(Rc::new(x)));
                },

                Instr::LoadConst(addr) => expr_stack.push(prog.fetch_const(addr)),
                Instr::LoadLocal(offset) => expr_stack.push(local_stack.get(local_stack.len() - 1 - offset as usize).unwrap().clone()),
                Instr::PushLocal => local_stack.push(expr_stack.pop().unwrap()),
                Instr::PopLocal => { local_stack.pop().unwrap(); },

                Instr::Jump(addr) => ip = addr,
                Instr::JumpIfNot(addr) => {
                    if matches!(expr_stack.pop().unwrap(), Value::Boolean(false)) {
                        ip = addr;
                    }
                },
                Instr::Call(addr) => {
                    call_stack.push(ip);
                    ip = addr;
                },
                Instr::Return(n) => {
                    let ret_val = expr_stack.pop().unwrap();
                    expr_stack.truncate(expr_stack.len() - n as usize);
                    if let Some(ret_addr) = call_stack.pop() {
                        expr_stack.push(ret_val);
                        ip = ret_addr;
                    } else {
                        return ret_val;
                    }
                },
            }
        }
    }
}
